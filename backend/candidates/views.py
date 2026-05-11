from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Candidate, Resume, Tag, CandidateTag, CandidateNote, CandidateActivity
from .serializers import CandidateSerializer, ResumeSerializer, CandidateNoteSerializer, CandidateActivitySerializer
from jobs.models import Job
from .extractors import extract_text
import re

from rest_framework.pagination import PageNumberPagination

class CandidatePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class CandidateViewSet(viewsets.ModelViewSet):
    serializer_class = CandidateSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CandidatePagination
    
    def get_queryset(self):
        # Base queryset — user's candidates
        job_id = self.request.query_params.get('job_id')
        queryset = Candidate.objects.filter(job__user=self.request.user)
        if job_id:
            queryset = queryset.filter(job_id=job_id)

        # Task 8.4: Advanced Filters
        min_score = self.request.query_params.get('min_score')
        max_score = self.request.query_params.get('max_score')
        status_filter = self.request.query_params.get('status')
        confidence = self.request.query_params.get('confidence')
        has_review = self.request.query_params.get('has_review')
        tag = self.request.query_params.get('tag')
        min_exp = self.request.query_params.get('min_experience')

        if min_score:
            queryset = queryset.filter(ats_score__gte=int(min_score))
        if max_score:
            queryset = queryset.filter(ats_score__lte=int(max_score))
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if confidence:
            queryset = queryset.filter(ai_evaluation__confidence=confidence)
        if has_review:
            queryset = queryset.filter(ai_evaluation__needs_review=(has_review.lower() == 'true'))
        if tag:
            queryset = queryset.filter(candidate_tags__tag__name__iexact=tag)
        
        # We need to filter by JSONField `parsed_data->experience_years` if min_exp is provided
        if min_exp:
            # Note: SQLite json1 extension or Postgres is required for json__ filtering.
            queryset = queryset.filter(resume__parsed_data__experience_years__gte=float(min_exp))

        # Order by score descending by default, then by created_at
        queryset = queryset.order_by('-ats_score', '-created_at')

        # Task 8.5: Top N / Top Percentage — ONLY apply on list views
        if self.action == 'list':
            top_n = self.request.query_params.get('top')
            top_pct = self.request.query_params.get('top_pct')

            if top_n:
                queryset = queryset[:int(top_n)]
            elif top_pct:
                total = queryset.count()
                limit = max(1, int(total * int(top_pct) / 100))
                queryset = queryset[:limit]

        return queryset

    @action(detail=False, methods=['post'], url_path='bulk-status')
    def bulk_status(self, request):
        candidate_ids = request.data.get('candidate_ids', [])
        new_status = request.data.get('status')

        valid_statuses = dict(Candidate.STATUS_CHOICES).keys()
        if new_status not in valid_statuses:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not candidate_ids:
            return Response({'error': 'No candidate_ids provided'}, status=status.HTTP_400_BAD_REQUEST)
            
        candidates = Candidate.objects.filter(id__in=candidate_ids, job__user=request.user)
        count = candidates.update(status=new_status)

        # Log feedback for scoring insights for bulk updates
        if new_status in ('shortlisted', 'rejected'):
            for cand in candidates:
                if cand.ats_score is not None:
                    self._log_scoring_feedback(cand, new_status)

        return Response({'message': f'Updated {count} candidates to {new_status}', 'count': count})

    @action(detail=True, methods=['put'], url_path='status')
    def update_status(self, request, pk=None):
        candidate = self.get_object()
        new_status = request.data.get('status')
        
        valid_statuses = dict(Candidate.STATUS_CHOICES).keys()
        if new_status not in valid_statuses:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        old_status = candidate.status
        candidate.status = new_status
        candidate.save()

        # Log activity for timeline tracking
        CandidateActivity.objects.create(
            candidate=candidate,
            activity_type='status_change',
            description=f'Status changed from {old_status} to {new_status}',
            old_value=old_status,
            new_value=new_status,
            created_by=request.user,
        )

        # Phase 9: Log feedback for scoring insights (DISPLAY ONLY — does NOT change scoring)
        if new_status in ('shortlisted', 'rejected') and candidate.ats_score is not None:
            self._log_scoring_feedback(candidate, new_status)

        return Response({'status': new_status})

    # ═══════════════════════════════════════════════════════════
    # Notes API
    # ═══════════════════════════════════════════════════════════

    @action(detail=True, methods=['get', 'post'], url_path='notes')
    def notes(self, request, pk=None):
        """GET/POST /api/candidates/<id>/notes/ — List or add notes."""
        candidate = self.get_object()

        if request.method == 'GET':
            notes = candidate.notes.all()
            return Response(CandidateNoteSerializer(notes, many=True).data)

        # POST — create a new note
        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Note content is required.'}, status=status.HTTP_400_BAD_REQUEST)

        note = CandidateNote.objects.create(
            candidate=candidate,
            user=request.user,
            content=content,
        )

        # Log activity
        CandidateActivity.objects.create(
            candidate=candidate,
            activity_type='note_added',
            description=f'Note added by {request.user.full_name or request.user.email}',
            created_by=request.user,
        )

        return Response(CandidateNoteSerializer(note).data, status=status.HTTP_201_CREATED)

    # ═══════════════════════════════════════════════════════════
    # Activity Timeline API
    # ═══════════════════════════════════════════════════════════

    @action(detail=True, methods=['get'], url_path='activities')
    def activity_list(self, request, pk=None):
        """GET /api/candidates/<id>/activities/ — Get candidate activity timeline."""
        candidate = self.get_object()
        activities = candidate.activities.all()[:50]  # Last 50 activities
        return Response(CandidateActivitySerializer(activities, many=True).data)

    @action(detail=True, methods=['post'], url_path='swap')
    def swap_pool(self, request, pk=None):
        """
        POST /api/candidates/<id>/swap/
        Swap a duplicate candidate with the active one.
        The duplicate becomes active, the old active becomes duplicate.
        """
        dup = self.get_object()
        if dup.pool != 'duplicate':
            return Response({'error': 'Only duplicate candidates can be swapped.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Find the currently active candidate with the same email + job
        active = Candidate.objects.filter(
            job=dup.job, email=dup.email, pool='active'
        ).first()

        if active:
            active.pool = 'duplicate'
            active.save()

        dup.pool = 'active'
        dup.save()

        return Response({
            'message': f'{dup.first_name} {dup.last_name} moved to Talent Pool.',
            'swapped_id': str(active.id) if active else None,
            'activated_id': str(dup.id),
        })

    @staticmethod
    def _log_scoring_feedback(candidate, action):
        """Track HR decisions by score range for insight display."""
        from analysis.models import ScoringFeedback

        score = candidate.ats_score
        # Determine score range bucket
        if score <= 20:
            bucket = '0-20'
        elif score <= 40:
            bucket = '20-40'
        elif score <= 60:
            bucket = '40-60'
        elif score <= 80:
            bucket = '60-80'
        else:
            bucket = '80-100'

        feedback, created = ScoringFeedback.objects.get_or_create(
            job=candidate.job,
            score_range=bucket,
            defaults={'total_candidates': 0, 'shortlisted': 0, 'rejected': 0}
        )
        feedback.total_candidates += 1
        if action == 'shortlisted':
            feedback.shortlisted += 1
        elif action == 'rejected':
            feedback.rejected += 1
        feedback.save()

    # Task 8.6: Boolean Search
    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        """
        GET /api/candidates/search/?q=React AND Node NOT Angular&job_id=xxx
        Boolean search on resume text. Supports AND, OR, NOT operators.
        """
        query = request.query_params.get('q', '')
        job_id = request.query_params.get('job_id')

        if not query:
            return Response({'error': 'q parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        queryset = Candidate.objects.filter(
            job__user=request.user,
            resume__parsed_text__isnull=False,
        )
        if job_id:
            queryset = queryset.filter(job_id=job_id)

        # Parse boolean query
        and_terms, or_terms, not_terms = _parse_boolean_query(query)

        matching_ids = []
        for candidate in queryset.select_related('resume'):
            text = (candidate.resume.parsed_text or '').lower()

            # AND: all terms must be present
            if and_terms and not all(_term_in_text(t, text) for t in and_terms):
                continue

            # OR: at least one must be present
            if or_terms and not any(_term_in_text(t, text) for t in or_terms):
                continue

            # NOT: none of these should be present
            if not_terms and any(_term_in_text(t, text) for t in not_terms):
                continue

            matching_ids.append(candidate.id)

        results = Candidate.objects.filter(id__in=matching_ids).order_by('-ats_score')
        serializer = CandidateSerializer(results, many=True)
        return Response({
            'count': len(matching_ids),
            'query': query,
            'results': serializer.data,
        })

    # Task 8.3: Tag management
    @action(detail=True, methods=['post'], url_path='tags')
    def add_tag(self, request, pk=None):
        """POST /api/candidates/<id>/tags/ — Add tag to candidate."""
        candidate = self.get_object()
        tag_name = request.data.get('name', '').strip()
        tag_color = request.data.get('color', '#6366f1')

        if not tag_name:
            return Response({'error': 'Tag name is required'}, status=status.HTTP_400_BAD_REQUEST)

        tag, _ = Tag.objects.get_or_create(
            user=request.user, name=tag_name,
            defaults={'color': tag_color}
        )
        CandidateTag.objects.get_or_create(candidate=candidate, tag=tag)

        return Response({'tag': tag_name, 'color': tag.color}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='tags/(?P<tag_name>[^/.]+)')
    def remove_tag(self, request, pk=None, tag_name=None):
        """DELETE /api/candidates/<id>/tags/<tag_name>/ — Remove tag."""
        candidate = self.get_object()
        CandidateTag.objects.filter(
            candidate=candidate, tag__name__iexact=tag_name, tag__user=request.user
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResumeUploadViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def create(self, request):
        file_obj = request.FILES.get('file')
        job_id = request.data.get('job_id')

        if not file_obj or not job_id:
            return Response({'error': 'file and job_id are required'}, status=status.HTTP_400_BAD_REQUEST)

        if not (file_obj.name.lower().endswith('.pdf') or file_obj.name.lower().endswith('.docx')):
            return Response({'error': 'Please upload a valid PDF or DOCX file.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            job = Job.objects.get(id=job_id, user=request.user)
        except Job.DoesNotExist:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)

        # 1. Extract text using robust extractors
        parsed_text, is_partial = extract_text(file_obj, file_obj.name)

        # 2. Auto-extract contact info from resume text
        extracted = self._extract_contact_info(parsed_text, file_obj.name)

        # Use form data if provided, else fall back to extracted, then defaults
        first_name = request.data.get('first_name') or extracted['first_name']
        last_name = request.data.get('last_name') or extracted['last_name']
        email = request.data.get('email') or extracted['email']
        phone = request.data.get('phone') or extracted['phone']

        # Task 8.1: Duplicate Detection → Duplicate Pool
        # If a candidate with the same email already exists in the ACTIVE pool,
        # create a new entry in the DUPLICATE pool so HR can compare and swap.
        existing = Candidate.objects.filter(job=job, email=email, pool='active').first()
        if existing and email != 'unknown@example.com':
            # Create the duplicate candidate
            dup_candidate = Candidate.objects.create(
                job=job,
                first_name=first_name,
                last_name=last_name,
                email=email,
                phone=phone,
                pool='duplicate',
            )
            Resume.objects.create(
                candidate=dup_candidate,
                file=file_obj,
                parsed_text=parsed_text
            )
            serializer = CandidateSerializer(dup_candidate)
            return Response(
                {**serializer.data, 'is_duplicate': True,
                 'message': f'{first_name} {last_name} already exists. CV added to Duplicate section for review.'},
                status=status.HTTP_200_OK
            )

        # 3. Create candidate (new)
        candidate = Candidate.objects.create(
            job=job,
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone
        )

        # 4. Save Resume
        resume = Resume.objects.create(
            candidate=candidate,
            file=file_obj,
            parsed_text=parsed_text
        )

        serializer = CandidateSerializer(candidate)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @staticmethod
    def _extract_contact_info(text, filename):
        """
        Extract name, email, phone from resume text.
        GUARDRAIL: Name extraction skips email/phone lines,
        uses letters-only pattern, falls back to filename.
        """
        import os

        result = {
            'first_name': 'Unknown',
            'last_name': 'Candidate',
            'email': 'unknown@example.com',
            'phone': '',
        }

        if not text or text.startswith('[Text Extraction'):
            # Extraction failed, use filename
            name_from_file = os.path.splitext(os.path.basename(filename))[0]
            name_from_file = re.sub(r'[_\-\d]+', ' ', name_from_file).strip()
            # Remove common non-name words
            skip = {'resume', 'cv', 'final', 'updated', 'new', 'copy', 'document'}
            parts = [p for p in name_from_file.split() if p.lower() not in skip]
            if parts:
                result['first_name'] = parts[0].title()
                result['last_name'] = parts[-1].title() if len(parts) > 1 else 'Candidate'
            return result

        # Extract email
        email_match = re.search(r'[\w.-]+@[\w.-]+\.\w{2,}', text)
        if email_match:
            result['email'] = email_match.group(0)

        # Extract phone
        phone_match = re.search(r'[\+]?[\d][\d\s\-\(\)]{8,14}[\d]', text)
        if phone_match:
            result['phone'] = phone_match.group(0).strip()

        # Extract name (GUARDRAIL: smart extraction)
        # Skip lines with @, 10+ digits, or common non-name words
        skip_words = {
            'resume', 'cv', 'curriculum', 'vitae', 'objective', 'summary',
            'profile', 'contact', 'details', 'information', 'about',
            'experience', 'education', 'skills', 'projects', 'certifications',
            'references', 'address', 'phone', 'email', 'personal',
        }
        lines = text.split('\n')

        for line in lines[:10]:  # Only check first 10 lines
            stripped = line.strip()
            if not stripped:
                continue
            if len(stripped) < 2 or len(stripped) > 50:
                continue
            # Skip if contains email
            if '@' in stripped:
                continue
            # Skip if contains many digits (phone/ids)
            if sum(c.isdigit() for c in stripped) >= 5:
                continue
            # Skip lines containing common resume header words
            line_words = set(stripped.lower().split())
            if line_words & skip_words:
                continue
            # Check if line is mostly letters + spaces (2-4 words = typical name)
            alpha_count = sum(c.isalpha() or c == ' ' for c in stripped)
            word_count = len(stripped.split())
            if alpha_count / len(stripped) >= 0.8 and 1 <= word_count <= 4:
                # This is likely the name
                parts = stripped.split()
                if parts:
                    result['first_name'] = parts[0].title()
                    result['last_name'] = ' '.join(parts[1:]).title() if len(parts) > 1 else 'Candidate'
                break

        return result


# ═══════════════════════════════════════════════════════════
# Helper: Boolean Query Parser (Task 8.6)
# ═══════════════════════════════════════════════════════════

def _parse_boolean_query(query):
    """
    Parse a boolean search query into AND, OR, NOT terms.
    Example: "React AND Node NOT Angular" → and_terms=['react', 'node'], not_terms=['angular']
    Example: "Python OR Java" → or_terms=['python', 'java']
    """
    and_terms = []
    or_terms = []
    not_terms = []

    # Split by spaces, preserving AND/OR/NOT operators
    tokens = query.split()
    current_operator = 'AND'  # Default operator

    for token in tokens:
        upper = token.upper()
        if upper == 'AND':
            current_operator = 'AND'
        elif upper == 'OR':
            current_operator = 'OR'
        elif upper == 'NOT':
            current_operator = 'NOT'
        else:
            term = token.lower().strip()
            if not term:
                continue
            if current_operator == 'AND':
                and_terms.append(term)
            elif current_operator == 'OR':
                or_terms.append(term)
            elif current_operator == 'NOT':
                not_terms.append(term)
                current_operator = 'AND'  # Reset after NOT term

    return and_terms, or_terms, not_terms


def _term_in_text(term, text):
    """Word-boundary aware search for a term in text."""
    pattern = r'\b' + re.escape(term) + r'\b'
    return bool(re.search(pattern, text, re.IGNORECASE))

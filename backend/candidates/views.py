from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Candidate, Resume
from .serializers import CandidateSerializer, ResumeSerializer
from jobs.models import Job
from .extractors import extract_text

class CandidateViewSet(viewsets.ModelViewSet):
    serializer_class = CandidateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Allow filtering candidates by job_id
        job_id = self.request.query_params.get('job_id')
        queryset = Candidate.objects.filter(job__user=self.request.user)
        if job_id:
            queryset = queryset.filter(job_id=job_id)
        return queryset.order_by('-created_at')

    @action(detail=True, methods=['put'], url_path='status')
    def update_status(self, request, pk=None):
        candidate = self.get_object()
        new_status = request.data.get('status')
        
        valid_statuses = dict(Candidate.STATUS_CHOICES).keys()
        if new_status not in valid_statuses:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
            
        candidate.status = new_status
        candidate.save()

        # Phase 9: Log feedback for scoring insights (DISPLAY ONLY — does NOT change scoring)
        if new_status in ('shortlisted', 'rejected') and candidate.ai_score is not None:
            self._log_scoring_feedback(candidate, new_status)

        return Response({'status': new_status})

    @staticmethod
    def _log_scoring_feedback(candidate, action):
        """Track HR decisions by score range for insight display."""
        from analysis.models import ScoringFeedback

        score = candidate.ai_score
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

        # 3. Create candidate
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
        import re
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
        skip_words = ['resume', 'cv', 'curriculum vitae', 'objective', 'summary', 'profile']
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
            # Skip common headers
            if stripped.lower() in skip_words:
                continue
            # Check if line is mostly letters + spaces
            alpha_count = sum(c.isalpha() or c == ' ' for c in stripped)
            if alpha_count / len(stripped) >= 0.8:
                # This is likely the name
                parts = stripped.split()
                if parts:
                    result['first_name'] = parts[0].title()
                    result['last_name'] = ' '.join(parts[1:]).title() if len(parts) > 1 else 'Candidate'
                break

        return result

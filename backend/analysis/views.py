from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import AIEvaluation
from .serializers import AIEvaluationSerializer
from .engine import ATSEngine
from candidates.models import Candidate

class AIEvaluationViewSet(viewsets.ModelViewSet):
    serializer_class = AIEvaluationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return AIEvaluation.objects.filter(candidate__job__user=self.request.user)

    @action(detail=False, methods=['post'], url_path='evaluate/(?P<candidate_id>[^/.]+)')
    def evaluate(self, request, candidate_id=None):
        candidate = get_object_or_404(Candidate, id=candidate_id, job__user=request.user)
        
        # Delete old evaluation if exists (allows re-scoring with updated engine)
        AIEvaluation.objects.filter(candidate=candidate).delete()
        
        # Call Real ATS Engine
        result = ATSEngine.evaluate(candidate)
        
        # Save evaluation
        evaluation = AIEvaluation.objects.create(
            candidate=candidate,
            overall_score=result['overall_score'],
            explanation=result['explanation'],
            strengths=result['strengths'],
            weaknesses=result['weaknesses'],
            interview_questions=result['interview_questions'],
            confidence=result.get('confidence', 'medium'),
            confidence_reasons=result.get('confidence_reasons', []),
            needs_review=result.get('needs_review', False),
            review_reason=result.get('review_reason', ''),
            score_breakdown=result.get('score_breakdown', {}),
            parsed_data=result.get('parsed_data', {}),
            red_flags=result.get('red_flags', []),
            role_relevance=result.get('role_relevance', {}).get('score'),
        )
        
        # Save parsed_data to Resume model as well (for persistence)
        try:
            if hasattr(candidate, 'resume') and candidate.resume:
                candidate.resume.parsed_data = result.get('parsed_data', {})
                candidate.resume.save(update_fields=['parsed_data'])
        except Exception:
            pass  # Non-critical — don't fail evaluation over this
        
        # Update Candidate with core score for list views
        candidate.ats_score = result['overall_score']
        candidate.ats_explanation = result['explanation']
        candidate.status = 'review' # Move to review automatically after parsing
        candidate.save()
        
        serializer = self.get_serializer(evaluation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='insights/(?P<job_id>[^/.]+)')
    def insights(self, request, job_id=None):
        """GET /api/analysis/insights/<job_id>/ — Return scoring insight text."""
        from .models import ScoringFeedback
        from jobs.models import Job

        job = get_object_or_404(Job, id=job_id, user=request.user)
        feedbacks = ScoringFeedback.objects.filter(job=job)

        if not feedbacks.exists():
            return Response({'insight': None})

        total_shortlisted = sum(f.shortlisted for f in feedbacks)
        total_rejected = sum(f.rejected for f in feedbacks)
        total = total_shortlisted + total_rejected

        if total == 0:
            return Response({'insight': None})

        # Find which score range has highest shortlist rate
        best_range = None
        best_rate = 0
        for f in feedbacks:
            bucket_total = f.shortlisted + f.rejected
            if bucket_total >= 2:  # Need at least 2 decisions to be meaningful
                rate = f.shortlisted / bucket_total
                if rate > best_rate:
                    best_rate = rate
                    best_range = f.score_range

        if best_range and best_rate > 0:
            insight = f"{round(best_rate * 100)}% of candidates scoring {best_range} were shortlisted for this job."
        else:
            insight = f"{total_shortlisted} shortlisted and {total_rejected} rejected out of {total} scored candidates."

        return Response({'insight': insight})

    @action(detail=False, methods=['post'], url_path='what-if')
    def what_if(self, request):
        """
        POST /api/analysis/what-if/
        Body: {job_id, remove_requirements: [skill_name, ...]}

        Re-runs scoring for all evaluated candidates with modified requirements.
        Does NOT save — read-only simulation.
        """
        from jobs.models import Job, JobRequirement

        job_id = request.data.get('job_id')
        remove_skills = request.data.get('remove_requirements', [])

        if not job_id:
            return Response({'error': 'job_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        job = get_object_or_404(Job, id=job_id, user=request.user)

        # Get all candidates with existing evaluations for this job
        evaluations = AIEvaluation.objects.filter(candidate__job=job).select_related('candidate')

        if not evaluations.exists():
            return Response({'results': [], 'message': 'No evaluated candidates found.'})

        results = []
        for eval_obj in evaluations:
            candidate = eval_obj.candidate
            original_score = eval_obj.overall_score

            # Temporarily remove specified requirements and re-score
            # We simulate by re-running the engine
            try:
                result = ATSEngine.evaluate(candidate)
                # Simple simulation: for each removed must-have that was missing,
                # estimate score boost based on weight
                missing_skills = [m['name'] for m in result.get('score_breakdown', {}).get('missing', []) or []]
                removed_and_missing = [s for s in remove_skills if s.lower() in [m.lower() for m in missing_skills]]

                # Estimate: each removed missing requirement would add ~10-15 points
                estimated_boost = len(removed_and_missing) * 12
                new_score = min(100, original_score + estimated_boost)

                results.append({
                    'candidate_id': str(candidate.id),
                    'candidate_name': f'{candidate.first_name} {candidate.last_name}',
                    'original_score': original_score,
                    'estimated_new_score': new_score,
                    'change': new_score - original_score,
                    'skills_removed': removed_and_missing,
                })
            except Exception:
                continue

        # Sort by change descending
        results.sort(key=lambda x: x['change'], reverse=True)

        return Response({
            'job_title': job.title,
            'removed_requirements': remove_skills,
            'results': results,
        })

    @action(detail=False, methods=['get'], url_path='cross-job/(?P<candidate_id>[^/.]+)')
    def cross_job(self, request, candidate_id=None):
        """
        GET /api/analysis/cross-job/<candidate_id>/

        Runs lightweight scoring for this candidate against ALL open jobs.
        Returns estimated scores per job, sorted by best match.
        """
        from jobs.models import Job

        candidate = get_object_or_404(Candidate, id=candidate_id, job__user=request.user)

        # Get all open jobs for this user (excluding current job)
        open_jobs = Job.objects.filter(
            user=request.user, status='active'
        ).exclude(id=candidate.job_id)

        if not open_jobs.exists():
            return Response({
                'candidate_name': f'{candidate.first_name} {candidate.last_name}',
                'current_job': candidate.job.title,
                'matches': [],
                'message': 'No other open jobs found.',
            })

        # Get resume text once
        resume_text = ""
        try:
            if hasattr(candidate, 'resume') and candidate.resume:
                resume_text = (candidate.resume.parsed_text or "").strip()
        except Exception:
            resume_text = ""

        if not resume_text:
            return Response({
                'candidate_name': f'{candidate.first_name} {candidate.last_name}',
                'matches': [],
                'message': 'No resume text available.',
            })

        matches = []
        quality = ATSEngine._check_resume_quality(resume_text)
        sections = ATSEngine._detect_sections(resume_text)

        for job in open_jobs[:10]:  # Limit to 10 jobs for performance
            try:
                requirements = list(job.requirements.all())
                if not requirements:
                    continue

                skill_result = ATSEngine._match_skills(resume_text, sections, requirements)
                experience_result = ATSEngine._calculate_experience(resume_text, job, sections)
                education_result = ATSEngine._check_education(resume_text, job)
                final_score = ATSEngine._calculate_final_score(
                    skill_result, experience_result, education_result, quality, job
                )

                matches.append({
                    'job_id': str(job.id),
                    'job_title': job.title,
                    'department': job.department,
                    'estimated_score': final_score['score'],
                    'skill_match_pct': final_score['skill_match_pct'],
                })
            except Exception:
                continue

        # Sort by score descending
        matches.sort(key=lambda x: x['estimated_score'], reverse=True)

        # Get current job score
        current_score = None
        try:
            current_eval = AIEvaluation.objects.get(candidate=candidate)
            current_score = current_eval.overall_score
        except AIEvaluation.DoesNotExist:
            pass

        return Response({
            'candidate_name': f'{candidate.first_name} {candidate.last_name}',
            'current_job': candidate.job.title,
            'current_score': current_score,
            'matches': matches,
        })

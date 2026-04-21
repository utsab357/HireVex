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
        )
        
        # Update Candidate with core score for list views
        candidate.ai_score = result['overall_score']
        candidate.ai_explanation = result['explanation']
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

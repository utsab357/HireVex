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
            interview_questions=result['interview_questions']
        )
        
        # Update Candidate with core score for list views
        candidate.ai_score = result['overall_score']
        candidate.ai_explanation = result['explanation']
        candidate.status = 'review' # Move to review automatically after parsing
        candidate.save()
        
        serializer = self.get_serializer(evaluation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

from django.db import models
from candidates.models import Candidate
import uuid

class AIEvaluation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    candidate = models.OneToOneField(Candidate, on_delete=models.CASCADE, related_name='ai_evaluation')
    overall_score = models.IntegerField()
    explanation = models.TextField()
    strengths = models.JSONField(default=list)
    weaknesses = models.JSONField(default=list)
    interview_questions = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"AI Eval for {self.candidate.first_name} {self.candidate.last_name}: {self.overall_score}"

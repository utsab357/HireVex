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
    confidence = models.CharField(max_length=10, default='medium', choices=[
        ('high', 'High'), ('medium', 'Medium'), ('low', 'Low'),
    ])
    confidence_reasons = models.JSONField(default=list)
    needs_review = models.BooleanField(default=False)
    review_reason = models.CharField(max_length=500, blank=True, default='')
    score_breakdown = models.JSONField(default=dict, blank=True)  # Detailed scoring components
    parsed_data = models.JSONField(default=dict, blank=True)  # Structured resume data
    red_flags = models.JSONField(default=list, blank=True)  # Red flags from red_flags engine
    role_relevance = models.IntegerField(null=True, blank=True)  # Role relevance score 0-100
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"AI Eval for {self.candidate.first_name} {self.candidate.last_name}: {self.overall_score}"


class ScoringFeedback(models.Model):
    """
    Tracks HR decisions (shortlist/reject) by score range for insight display.
    GUARDRAIL: This is DISPLAY ONLY. It does NOT change how scoring works.
    """
    job = models.ForeignKey('jobs.Job', on_delete=models.CASCADE, related_name='scoring_feedback')
    score_range = models.CharField(max_length=10)  # "0-20", "20-40", "40-60", "60-80", "80-100"
    total_candidates = models.IntegerField(default=0)
    shortlisted = models.IntegerField(default=0)
    rejected = models.IntegerField(default=0)

    class Meta:
        unique_together = ('job', 'score_range')

    def __str__(self):
        return f"{self.job.title} | {self.score_range}: {self.shortlisted} shortlisted, {self.rejected} rejected"

from django.db import models
import uuid
from jobs.models import Job

class Candidate(models.Model):
    STATUS_CHOICES = [
        ('new', 'New'),
        ('review', 'Review'),
        ('shortlisted', 'Shortlisted'),
        ('interview', 'Interview'),
        ('on_hold', 'On Hold'),
        ('offer', 'Offer'),
        ('rejected', 'Rejected'),
    ]

    POOL_CHOICES = [
        ('active', 'Active'),
        ('duplicate', 'Duplicate'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='candidates')
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    pool = models.CharField(max_length=10, choices=POOL_CHOICES, default='active')
    
    # Phase 3 Fields (Setup now to avoid migration issues later)
    ats_score = models.IntegerField(null=True, blank=True, db_column='ai_score')
    ats_explanation = models.TextField(null=True, blank=True, db_column='ai_explanation')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Resume(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    candidate = models.OneToOneField(Candidate, on_delete=models.CASCADE, related_name='resume')
    file = models.FileField(upload_to='resumes/')
    parsed_text = models.TextField(blank=True, null=True) # Where PyPDF2 dumps the raw text
    parsed_data = models.JSONField(blank=True, null=True)  # Structured extraction: work entries, education, certs
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Resume for {self.candidate}"


class Tag(models.Model):
    """User-defined tags for categorizing candidates."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='tags')
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#6366f1')  # Hex color

    class Meta:
        unique_together = ('user', 'name')

    def __str__(self):
        return self.name


class CandidateTag(models.Model):
    """Many-to-many relationship between candidates and tags."""
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='candidate_tags')
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE, related_name='candidate_tags')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('candidate', 'tag')

    def __str__(self):
        return f"{self.candidate} — {self.tag.name}"


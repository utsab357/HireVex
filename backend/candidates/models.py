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

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='candidates')
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    
    # Phase 3 Fields (Setup now to avoid migration issues later)
    ai_score = models.IntegerField(null=True, blank=True)
    ai_explanation = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Resume(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    candidate = models.OneToOneField(Candidate, on_delete=models.CASCADE, related_name='resume')
    file = models.FileField(upload_to='resumes/')
    parsed_text = models.TextField(blank=True, null=True) # Where PyPDF2 dumps the raw text
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Resume for {self.candidate}"

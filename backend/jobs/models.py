from django.db import models
from django.conf import settings
import uuid

class Job(models.fields.UUIDField):
    pass # Hack to make UUIDField usage below clean

class Job(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='jobs')
    title = models.CharField(max_length=255)
    department = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=50, choices=[('active', 'Active'), ('closed', 'Closed')], default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.department}"

class JobRequirement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='requirements')
    skill_name = models.CharField(max_length=255)
    importance = models.IntegerField(default=3) # 1-5 scale
    is_must_have = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.skill_name} ({self.job.title})"

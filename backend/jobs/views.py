from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Job, JobRequirement
from .serializers import JobSerializer, JobCreateSerializer

class JobViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Users should only see jobs they created, or arguably HR sees all jobs in their company.
        # For simplicity, returning user's jobs for now.
        return Job.objects.filter(user=self.request.user).order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create' or self.action == 'update':
            return JobCreateSerializer
        return JobSerializer

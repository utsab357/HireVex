from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Job, JobRequirement
from .serializers import JobSerializer, JobCreateSerializer
from .utils import extract_skills_from_text

class JobViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Users should only see jobs they created, or arguably HR sees all jobs in their company.
        # For simplicity, returning user's jobs for now.
        return Job.objects.filter(user=self.request.user).order_by('-created_at')

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return JobCreateSerializer
        return JobSerializer

    @action(detail=False, methods=['post'], url_path='extract-skills')
    def extract_skills(self, request):
        """POST /api/jobs/extract-skills/ — Extract skills from job description text."""
        description = request.data.get('description', '')
        if not description.strip():
            return Response({'skills': []}, status=status.HTTP_200_OK)

        skills = extract_skills_from_text(description)
        return Response({'skills': skills}, status=status.HTTP_200_OK)

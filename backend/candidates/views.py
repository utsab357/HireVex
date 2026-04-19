from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Candidate, Resume
from .serializers import CandidateSerializer, ResumeSerializer
from jobs.models import Job
import PyPDF2

class CandidateViewSet(viewsets.ModelViewSet):
    serializer_class = CandidateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Allow filtering candidates by job_id
        job_id = self.request.query_params.get('job_id')
        queryset = Candidate.objects.filter(job__user=self.request.user)
        if job_id:
            queryset = queryset.filter(job_id=job_id)
        return queryset.order_by('-created_at')

    @action(detail=True, methods=['put'], url_path='status')
    def update_status(self, request, pk=None):
        candidate = self.get_object()
        new_status = request.data.get('status')
        
        valid_statuses = dict(Candidate.STATUS_CHOICES).keys()
        if new_status not in valid_statuses:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
            
        candidate.status = new_status
        candidate.save()
        
        return Response({'status': new_status})

class ResumeUploadViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def create(self, request):
        file_obj = request.FILES.get('file')
        job_id = request.data.get('job_id')
        first_name = request.data.get('first_name', 'Unknown')
        last_name = request.data.get('last_name', 'Candidate')
        email = request.data.get('email', 'unknown@example.com')
        phone = request.data.get('phone', '')

        if not file_obj or not job_id:
            return Response({'error': 'file and job_id are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            job = Job.objects.get(id=job_id, user=request.user)
        except Job.DoesNotExist:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)

        # 1. Create candidate
        candidate = Candidate.objects.create(
            job=job,
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone
        )

        # 2. Extract text with PyPDF2
        parsed_text = ""
        try:
            pdf_reader = PyPDF2.PdfReader(file_obj)
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    parsed_text += text + "\n"
        except Exception as e:
            # If parsing fails, store error string or leave empty, but don't fail upload
            parsed_text = f"[Text Extraction Failed: {str(e)}]"

        # Rewind file pointer after reading!
        file_obj.seek(0)

        # 3. Save Resume
        resume = Resume.objects.create(
            candidate=candidate,
            file=file_obj,
            parsed_text=parsed_text
        )

        serializer = CandidateSerializer(candidate)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from candidates.models import Candidate
from django.shortcuts import get_object_or_404

class OutreachGeneratorView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        candidate_id = request.data.get('candidate_id')
        template_type = request.data.get('type') # 'interview', 'offer', 'rejection'
        
        candidate = get_object_or_404(Candidate, id=candidate_id, job__user=request.user)
        job = candidate.job
        
        # In a real app we'd use OpenAI here too
        # For our Mock implementation, we use hardcoded templates with dynamic variable insertion
        
        signature = f"\n\nBest regards,\n{request.user.full_name}\n{job.department} Team"
        
        if template_type == 'interview':
            subject = f"Interview Invitation: {job.title} at Hirevex"
            body = f"Hi {candidate.first_name},\n\nThank you for your interest in the {job.title} role! We were impressed by your background, particularly your strengths with modern web frameworks.\n\nWe would love to invite you to a brief 30-minute introductory call to discuss the role and your background in more detail.\n\nPlease let us know what times work best for you next week." + signature
            
        elif template_type == 'offer':
            subject = f"Offer of Employment: {job.title}"
            body = f"Dear {candidate.first_name},\n\nWe are thrilled to offer you the position of {job.title} on our {job.department} team! Your structured approach to problems and strong technical foundation make you a perfect fit for this role.\n\nPlease find the attached offer letter outlining the details." + signature
            
        elif template_type == 'rejection':
            subject = f"Update regarding the {job.title} role"
            body = f"Hi {candidate.first_name},\n\nThank you for taking the time to apply for the {job.title} position. While we were impressed with your resume, we have decided to move forward with other candidates whose experience better aligns with our specific needs for this role, particularly regarding our cloud infrastructure requirements.\n\nWe will keep your resume on file for future opportunities." + signature
            
        else:
            return Response({'error': 'Invalid template type'}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response({
            'subject': subject,
            'body': body
        })

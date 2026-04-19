from rest_framework import serializers
from .models import Candidate, Resume

class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ('id', 'file', 'uploaded_at', 'parsed_text')
        read_only_fields = ('id', 'parsed_text', 'uploaded_at')

class CandidateSerializer(serializers.ModelSerializer):
    resume = ResumeSerializer(read_only=True)
    
    class Meta:
        model = Candidate
        fields = ('id', 'job', 'first_name', 'last_name', 'email', 'phone', 'status', 'ai_score', 'ai_explanation', 'created_at', 'resume')
        read_only_fields = ('id', 'created_at', 'ai_score', 'ai_explanation')

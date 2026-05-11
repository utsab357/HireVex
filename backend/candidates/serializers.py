from rest_framework import serializers
from .models import Candidate, Resume, CandidateNote, CandidateActivity

class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ('id', 'file', 'uploaded_at')
        read_only_fields = ('id', 'uploaded_at')


class CandidateNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = CandidateNote
        fields = ('id', 'content', 'author_name', 'created_at')
        read_only_fields = ('id', 'author_name', 'created_at')

    def get_author_name(self, obj):
        return obj.user.full_name or obj.user.email


class CandidateActivitySerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CandidateActivity
        fields = ('id', 'activity_type', 'description', 'old_value', 'new_value', 'created_by_name', 'created_at')
        read_only_fields = ('id', 'created_at')

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.full_name or obj.created_by.email
        return 'System'


class CandidateSerializer(serializers.ModelSerializer):
    resume = ResumeSerializer(read_only=True)
    confidence = serializers.SerializerMethodField()
    notes = CandidateNoteSerializer(many=True, read_only=True)
    activities = CandidateActivitySerializer(many=True, read_only=True)
    
    class Meta:
        model = Candidate
        fields = ('id', 'job', 'first_name', 'last_name', 'email', 'phone', 'status', 'pool', 'ats_score', 'ats_explanation', 'created_at', 'resume', 'confidence', 'notes', 'activities')
        read_only_fields = ('id', 'created_at', 'ats_score', 'ats_explanation')

    def get_confidence(self, obj):
        try:
            return obj.ai_evaluation.confidence
        except Exception:
            return None

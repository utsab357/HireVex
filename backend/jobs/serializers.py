from rest_framework import serializers
from .models import Job, JobRequirement

class JobRequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobRequirement
        fields = ('id', 'skill_name', 'importance', 'is_must_have')
        read_only_fields = ('id',)

class JobSerializer(serializers.ModelSerializer):
    requirements = JobRequirementSerializer(many=True, read_only=True)
    
    class Meta:
        model = Job
        fields = ('id', 'title', 'department', 'location', 'description', 'status', 'created_at', 'requirements')
        read_only_fields = ('id', 'created_at')

class JobCreateSerializer(serializers.ModelSerializer):
    requirements = JobRequirementSerializer(many=True, required=False)

    class Meta:
        model = Job
        fields = ('id', 'title', 'department', 'location', 'description', 'status', 'requirements')
        read_only_fields = ('id',)

    def create(self, validated_data):
        requirements_data = validated_data.pop('requirements', [])
        job = Job.objects.create(user=self.context['request'].user, **validated_data)
        for req_data in requirements_data:
            JobRequirement.objects.create(job=job, **req_data)
        return job

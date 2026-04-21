from rest_framework import serializers
from .models import Job, JobRequirement

class JobRequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobRequirement
        fields = ('id', 'skill_name', 'importance', 'is_must_have')
        read_only_fields = ('id',)

class JobSerializer(serializers.ModelSerializer):
    requirements = JobRequirementSerializer(many=True, read_only=True)
    candidates_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = ('id', 'title', 'department', 'location', 'description', 'status', 'min_experience', 'max_experience', 'education_level', 'internship_policy', 'created_at', 'updated_at', 'requirements', 'candidates_count')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_candidates_count(self, obj):
        return obj.candidates.count()

class JobCreateSerializer(serializers.ModelSerializer):
    requirements = JobRequirementSerializer(many=True, required=False)

    class Meta:
        model = Job
        fields = ('id', 'title', 'department', 'location', 'description', 'status', 'min_experience', 'max_experience', 'education_level', 'internship_policy', 'requirements')
        read_only_fields = ('id',)

    def create(self, validated_data):
        requirements_data = validated_data.pop('requirements', [])
        job = Job.objects.create(user=self.context['request'].user, **validated_data)
        for req_data in requirements_data:
            JobRequirement.objects.create(job=job, **req_data)
        return job

    def update(self, instance, validated_data):
        requirements_data = validated_data.pop('requirements', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if requirements_data is not None:
            instance.requirements.all().delete()
            for req_data in requirements_data:
                JobRequirement.objects.create(job=instance, **req_data)
        return instance

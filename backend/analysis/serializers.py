from rest_framework import serializers
from .models import AIEvaluation

class AIEvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIEvaluation
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CandidateViewSet, ResumeUploadViewSet

router = DefaultRouter()
router.register(r'upload', ResumeUploadViewSet, basename='candidate-upload')
router.register(r'', CandidateViewSet, basename='candidate')

urlpatterns = [
    path('', include(router.urls)),
]

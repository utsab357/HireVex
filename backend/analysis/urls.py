from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AIEvaluationViewSet

router = DefaultRouter()
router.register(r'', AIEvaluationViewSet, basename='analysis')

urlpatterns = [
    path('', include(router.urls)),
]

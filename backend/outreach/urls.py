from django.urls import path
from .views import OutreachGeneratorView

urlpatterns = [
    path('generate/', OutreachGeneratorView.as_view(), name='outreach-generate'),
]

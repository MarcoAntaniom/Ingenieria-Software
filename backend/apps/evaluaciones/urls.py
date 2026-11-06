from django.urls import path
from .views import *

urlpatterns = [
    path('create/', view=TareaView.as_view(), name='crate'),
]

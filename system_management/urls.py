from unicodedata import name
from django.urls import path
from system_management import views

urlpatterns = [

    path(
        'check_file_exists',
        views.check_file_exists,
        name="check_file_exists"
    ),

    path(
        'get_uploaded_chunks',
        views.get_uploaded_chunks,
        name="get_uploaded_chunks"
    ),


]

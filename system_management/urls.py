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
        'retrieve_uploaded_chunks',
        views.retrieve_uploaded_chunks,
        name="retrieve_uploaded_chunks"
    ),

    path(
        'store_file_data',
        views.store_file_data,
        name="store_file_data"
    ),

    path(
        'store_chunk_meta_data',
        views.store_chunk_meta_data,
        name="store_chunk_meta_data"
    ),

]

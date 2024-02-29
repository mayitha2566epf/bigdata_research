from django.shortcuts import render
from decouple import config

# Create your views here.
def home(request):

    IDENTITY_POOL_REGION = config("IDENTITY_POOL_REGION")
    IDENTITY_POOL_ID = config("IDENTITY_POOL_ID")
    OBJECT_KEY = config("OBJECT_KEY")
    BUCKET_NAME = config("BUCKET_NAME")
    BUCKET_REGION = config("BUCKET_REGION")

    context = {
        "IDENTITY_POOL_REGION":IDENTITY_POOL_REGION,
        "IDENTITY_POOL_ID":IDENTITY_POOL_ID,
        "OBJECT_KEY":OBJECT_KEY,
        "BUCKET_NAME":BUCKET_NAME,
        "BUCKET_REGION":BUCKET_REGION,
    }
    
    return render(request, "system_management\home.html",context=context)
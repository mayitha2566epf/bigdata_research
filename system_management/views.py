from django.shortcuts import render
from decouple import config
from system_management.models import *
from django.http import HttpResponse, JsonResponse

import boto3


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


def check_file_exists(request):

    if request.method == "GET":

        file_name = request.POST.get("file_name")
        file_size = request.POST.get("file_size")

        file_exists = FIleUpload.objects.filter(
            file_name = file_name,
            file_size = file_size,
        ).exists()

        request_body = {
            "data" : {
                "file_exists" : f"{file_exists}"
            }
        }

        return JsonResponse(request_body,status=200)


def get_uploaded_chunks(request):
    if request.method == "GET":

        upload_id = request.GET.get("upload")
        key = request.GET.get("key")
        
        s3_client = boto3.client(
            's3'
        )
        
        BUCKET_NAME = config("BUCKET_NAME")
        upload_id = upload_id
        key = key
        
        response = s3_client.list_parts(
            Bucket=BUCKET_NAME,
            Key=key,
            UploadId=upload_id
        )
        
        print(response)


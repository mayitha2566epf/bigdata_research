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

        file_name = request.GET.get("file_name")
        file_size = request.GET.get("file_size")

        file_data = FIleUpload.objects.filter(
            file_name = file_name,
            file_size = file_size,
            upload_completed = False,
        )

        file_exists = file_data.exists()

        if file_exists:
        
            upload_id = file_data.first().upload_id
        
        else:
            upload_id = None

        request_body = {
            "data" : {
                "file_exists" : f"{file_exists}",
                "upload_id" : upload_id,
            }
        }

        return JsonResponse(request_body,status=200)


def retrieve_uploaded_chunks(request):
    if request.method == "POST":

        upload_id = request.POST.get("upload_id")

        file_upload_obj = FIleUpload.objects.get(
            upload_id=upload_id
        )

        object_key = file_upload_obj.object_key

        aws_access_key_id = config("AWS_ACCESS_KEY_ID")
        aws_secret_access_key = config("AWS_SECRET_ACCESS_KEY")
        BUCKET_NAME = config("BUCKET_NAME")


        s3_client = boto3.client(
            's3',
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
        )

        try:

            response = s3_client.list_parts(
                Bucket=BUCKET_NAME,
                Key=object_key,
                UploadId=upload_id,
            )

        except:
            file_upload_obj.delete()

            
            request_body = {
                "message" : "no parts found"
            }

            return JsonResponse(request_body,status=400)

        parts = response.get('Parts', [])

        successful_parts = []

        for part in parts:

            part_number = part["PartNumber"]

            successful_parts.append(
                {
                    "PartNumber":part_number,
                    "ETag":part["ETag"],
                }
            )

        request_body = {
            "data" : {
                "successful_parts" : successful_parts,
            }
        }

        return JsonResponse(request_body,status=200)


def store_file_data(request):
    if request.method == "POST":

        file_name = request.POST.get("file_name")
        file_size = request.POST.get("file_size")
        upload_id = request.POST.get("upload_id")

        object_key = f"{config("OBJECT_KEY")}/{file_name}"
        
        FIleUpload.objects.create(
            file_name=file_name,
            upload_id=upload_id,
            file_size=file_size,
            object_key=object_key,
        )

        return JsonResponse({},status=200)


def store_chunk_meta_data(request):
    if request.method == "POST":

        part_number = request.POST.get("part_number")
        start = request.POST.get("start")
        end = request.POST.get("end")
        upload_id = request.POST.get("upload_id")

        file_upload_obj = FIleUpload.objects.filter(
            upload_id = upload_id 
        )

        if file_upload_obj.exists():
            file_upload = file_upload_obj.first()

            FileMetaData.objects.create(
                part_number=part_number,
                start=start,
                end=end,
                file_upload=file_upload
            )

        return JsonResponse({},status=200)



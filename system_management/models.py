from django.db import models


class FIleUpload(models.Model):
    file_name = models.TextField()
    upload_id = models.TextField()
    file_size = models.CharField(max_length=250)
    upload_completed = models.BooleanField(default=False)
    object_key = models.TextField(default="")


class FileMetaData(models.Model):
    part_number = models.CharField(max_length=250)
    start = models.CharField(max_length=250)
    end = models.CharField(max_length=250)
    file_upload = models.ForeignKey(FIleUpload,on_delete=models.CASCADE)
async function initiate_multipart_upload(bucket_name, object_key, s3) {
    try {
        var params = {
            Bucket: bucket_name,
            Key: object_key,
        };
        var result = await s3.createMultipartUpload(params).promise();
        return result.UploadId;
    } catch (error) {
        console.error('Error initiating multipart upload:', error);
        throw error;
    }
}


async function uploadParts(file, upload_id, chunk_size) {

    var file_size = file.size;
    var total_chunks = Math.ceil(file_size / chunk_size);
    var successfulParts = [];

    let upload_promises = [];

    for (let start = 0; start < file_size; start += chunk_size) {

        var end = Math.min(start + chunk_size, file.size);
        var chunk_data = file.slice(start, end);

        var params = {
            Bucket: bucket_name,
            Key: object_key,
            PartNumber: part_number,
            UploadId: upload_id,
            Body: chunk_data
        };

        var result = s3.uploadPart(params)

        var uploadObject = {
            part_number: part_number,
            promise: result.promise()
        };

        upload_promises.push(uploadObject);
        part_number++;

        if (upload_promises.length >= 10 || start + chunk_size >= file_size) {

            var results = await waitForUploadPromises(
                upload_promises=upload_promises,
                successfulParts=successfulParts
            );

            results.forEach(function(result){
                if (result !== null){
                    successfulParts.push(result)
                }

            });

            upload_promises = [];
        }
    }

    var results = await waitForUploadPromises(
        upload_promises=upload_promises,
        successfulParts=successfulParts
    );

    results.forEach(function(result){
        if (result !== null){
            successfulParts.push(result)
        }

    });

    return successfulParts;
}


async function waitForUploadPromises(uploadPromises, successfulParts) {

    var results = await Promise.all(uploadPromises.map(async (obj) => {

        try {

            var result = await obj.promise;

            var part = {
                ETag: result.ETag,
                PartNumber: obj.part_number
            };

            successfulParts.push(part);

            return part;

        } catch (error) {
            console.error("Error uploading part:", error);
            return null;
        }
    }));

    return results;
}



async function retry_failed_uploads(file_size, successful_parts, upload_id,) {

    upload_promises = [];
    part_number = 0;


    for (let start = 0; start < file_size; start += chunk_size) {

        part_number +=1

        if (successful_parts.some(item => item.PartNumber === part_number)) {
            continue;
        }

        try {

            var failed_chunk_start = (part_number - 1) * chunk_size

            var failed_chunk_end = Math.min(part_number * chunk_size, file_size)

            var failed_chunk = file.slice(failed_chunk_start,failed_chunk_end)

            var params = {
                Bucket: bucket_name,
                Key: object_key,
                PartNumber: failed_part_number,
                UploadId: upload_id,
                Body: failed_chunk
            };

            var ETag = await s3.uploadPart(params).promise()

            var part = {
                ETag: ETag.ETag,
                PartNumber: part_number
            }

            successful_parts.push(part)

            


        } catch (error) {
            console.error("Error retrying upload!!!", error);
        }

    }

    return successful_parts

}


async function complete_mutlipart_upload(upload_id, successfulParts) {

    try {

        var completeParams = {
            Bucket: bucket_name,
            Key: object_key,
            UploadId: upload_id,
            MultipartUpload: {
                Parts: successfulParts
            }
        };

        await s3.completeMultipartUpload(completeParams).promise();

        console.log("Upload completed successfully.");

    } catch (error) {
        console.error("Error completing multipart upload:", error);
        throw error;
    }
}


function file_already_exists(file){

    payload = {
        "file_name" : file.name,
        "file_size" : file.size
    }

    $.ajax({
        type:'GET',
        url:CHECK_FILE_EXISTS_URL,
        data:payload,
        success: async function(response){

            var file_exists = response.data.file_exists;

            if( file_exists == "False" ){

                var upload_id = await initiate_multipart_upload(
                    bucket_name=bucket_name,
                    object_key=object_key,
                    s3=s3
                )

                var successful_parts = await uploadParts(
                    file=file,
                    uploadId=upload_id,
                    chunk_size=chunk_size
                )

                var total_chunks = Math.ceil(file_size / chunk_size);

            }

            
        },
        error: function (response) {},
    });
    
}

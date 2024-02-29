$(document).on('click','#upload',function(){
        var csv_input = $('#csv_input').prop('files')[0]; 
        var file_name = 'file_name.csv';
        AWS.config.update({
            region: IDENTITY_POOL_REGION,
            credentials: new AWS.CognitoIdentityCredentials({
                IdentityPoolId: IDENTITY_POOL_ID , // replace with your actual Identity Pool ID
            })
        });

        var bucket_name = BUCKET_NAME;
        
        var object_key = `${OBJECT_KEY}/${file_name}`;
    
        var s3 = new AWS.S3({ region: BUCKET_REGION });
    

        upload_file_to_s3(
            file = csv_input,
            s3 = s3,
            bucket_name = bucket_name,
            object_key = object_key,
        )
        
        })
    
        async function initialMultipartUpload(bucketName, objectKey, s3) {
            try {
                // Initialize the multipart upload
                const params = {
                    Bucket: bucketName,
                    Key: objectKey,
                };
        
                const result = await s3.createMultipartUpload(params).promise();
                return result.UploadId;
            } catch (error) {
                console.error('Error initiating multipart upload:', error);
                throw error;
            }
        }

async function upload_file_to_s3(file,s3,bucket_name,object_key){

    var chunk_size = 5 * 1024 * 1024;
    // var chunk_size = 50 * 1024 * 1024;
    var upload_id;

    try{

        const init_response = await initialMultipartUpload(
            bucket_name = bucket_name,
            object_key = object_key,
            s3 = s3,
        );

        upload_id = init_response

        var start = 0;
        var part_number = 1;
        var parts = [];

        console.log("file size")
        console.log(file.size)

        // alert(upload_id)
        while (start < file.size) {

            var end = Math.min(start + chunk_size, file.size);
            var chunk_data = file.slice(start, end);

            const params = {
                Bucket: bucket_name,
                Key: object_key,
                PartNumber: part_number,
                UploadId: upload_id,
                Body: chunk_data
            };

            const { ETag } = await s3.uploadPart(params).promise();

            parts.push({ ETag,"PartNumber": part_number,});

            start += chunk_size; // Increment start for the next iteration
            part_number = part_number + 1; // Increment part_number for the next iteration

            console.log("***start****")
            console.log(start)

            console.log("***end****")
            console.log(end)

            console.log("***counter****")
            console.log(part_number)

        }

        // Complete file upload starting

        var params = {
            Bucket: bucket_name,
            Key: object_key,
            UploadId: upload_id,
            MultipartUpload: {
                Parts: parts
            }
        };

        await s3.completeMultipartUpload(params).promise();

        Swal.fire({
            icon:'success',
            html: `Uploaded`,
            allowOutsideClick: false,
            showConfirmButton:false,
        });

    }catch (error) {

        console.error("Error uploading file:", error);
    }

}

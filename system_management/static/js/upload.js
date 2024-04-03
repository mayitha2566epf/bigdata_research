AWS.config.update({
    region: IDENTITY_POOL_REGION,
    credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: IDENTITY_POOL_ID, // replace with your actual Identity Pool ID
    }),
    maxRetries: 0,
});


var bucket_name = BUCKET_NAME;
var object_key = `${OBJECT_KEY}`;
var s3 = new AWS.S3({ region: BUCKET_REGION });
var chunk_size = 5 * 1024 * 1024;
var part_number = 1; // Initialize part number


$(document).on('click', '#upload', async function () {
    var file = $('#csv_input').prop('files')[0];

    var file_size = file.size

    object_key = `${object_key}/${file.name}`

    file_already_exists(file);


    if (successful_parts.length != total_chunks){

        Swal.fire({
            title: 'Some files not uploaded, Do you wish to retry?',
            icon: 'error',
            showCancelButton: true,
            confirmButtonText: 'Yes',
        }).then(async(result) => {
            if (result.isConfirmed) {

                data = {
                    "upload_id": upload_id,
                    "key" : object_key,
                    "csrfmiddlewaretoken": CSRF_TOKEN
                }

                $.ajax({
                    type:'GET',
                    url:GET_UPLOADED_CHUNKS_URL,
                    data:data,
                    success: async function(response){

                        var successful_parts = response.successful_parts

                        // successful_parts = await retry_failed_uploads(
                        //     file_size,
                        //     successful_parts,
                        //     upload_id,
                        // );

                        // retry_check(
                        //     successful_parts=successful_parts,
                        //     total_chunks=total_chunks,
                        //     upload_id=upload_id
                        // )
                        
                        alert("done")
                    },
                    error: function (response) {},
                });


            }
        });

    }

    else{

        complete_mutlipart_upload(
            uploadId=upload_id,
            successfulParts=successful_parts
        )

    }

});


function retry_check(total_chunks,upload_id){



    if (successful_parts.length != total_chunks){

        Swal.fire({
            title: 'Failed to retry upload',
            icon: 'error',
            showCancelButton: true,
            confirmButtonText: 'Yes',
        })
    }

    else{

        complete_mutlipart_upload(
            uploadId=upload_id,
            successfulParts=successful_parts
        )

    }



}

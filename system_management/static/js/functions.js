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

    var initial_chunk_size = get_initial_chunk();

    upload_initial_chunk(initail_chunk_size,file);

    var file_size = file.size;
    
    var successful_parts = [];

    let upload_promises = [];

    var part_number = 1;

    for (let start = 0; start < file_size; start += chunk_size) {

        var end = Math.min(start + chunk_size, file_size);
        var chunk_data = file.slice(start, end);

        var params = {
            Bucket: bucket_name,
            Key: object_key,
            PartNumber: part_number,
            UploadId: upload_id,
            Body: chunk_data,
            Metadata: {
                "test case": "1"
            }
        
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
            );

            results.forEach(function(result){
                if (result !== null){
                    successful_parts.push(result)
                }

            });

            upload_promises = [];
        }
    }

    var results = await waitForUploadPromises(
        upload_promises=upload_promises,
    );

    results.forEach(function(result){
        if (result !== null){
            successful_parts.push(result)
        }

    });

    return successful_parts;
}


async function waitForUploadPromises(uploadPromises) {

    var results = await Promise.all(uploadPromises.map(async (obj) => {

        try {

            var result = await obj.promise;

            console.log(result);

            var part = {
                ETag: result.ETag,
                PartNumber: obj.part_number
            };

            return part;

        } catch (error) {
            console.error("Error uploading part:", error);
            return null;
        }
    }));

    return results;
}


async function complete_mutlipart_upload(upload_id, successful_parts) {

    try {

        var completeParams = {
            Bucket: bucket_name,
            Key: object_key,
            UploadId: upload_id,
            MultipartUpload: {
                Parts: successful_parts
            }
        };

        await s3.completeMultipartUpload(completeParams).promise();

        Swal.fire({
            title: 'Done',
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: 'Yesss',
        })

    } catch (error) {
        console.error("Error completing multipart upload:", error);
        throw error;
    }
}


function file_already_exists(file,object_key){

    var file_size = file.size;

    var total_number_of_chunks = Math.ceil(file_size / chunk_size);

    payload = {
        "file_name" : file.name,
        "file_size" : file_size
    }

    $.ajax({
        type:'GET',
        url:CHECK_FILE_EXISTS_URL,
        data:payload,
        success: async function(response){

            var response_data = response.data;

            var file_exists = response_data.file_exists;
            var upload_id;

            if( file_exists == "False" ){

                start_file_data_upload(
                    payload,
                    total_number_of_chunks,
                    file_size,
                    file
                )

            }

            else{
                
                Swal.fire({
                    title: 'The file exists and it did not complete upload.',
                    text: 'Do you wish to retry',
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: 'Yes',
                }).then(async(result) => {

                    if (result.isConfirmed) {

                        upload_id = response_data.upload_id;

                        retrieve_uploaded_chunks(
                            upload_id,
                            file_size,
                            total_number_of_chunks,
                            file
                        )
                    }
                });
            }
        },
        error: function () {
            
            Swal.fire({
                title: 'could not check if file exists',
                icon: 'error',
                showCancelButton: true,
                confirmButtonText: 'Yes',
            })
            
        },
    });
    
}


function retrieve_uploaded_chunks(upload_id,file_size,total_number_of_chunks,file){

    payload = {
        "upload_id" : upload_id,
        "csrfmiddlewaretoken" : CSRF_TOKEN,
    }

    $.ajax({
        type:'POST',
        url:REIRIEVE_UPLOADED_CHUNKS_URL,
        data:payload,
        success: async function(response){

            var successful_parts = response.data.successful_parts

            successful_parts = await retry_failed_uploads(
                file_size,
                successful_parts,
                upload_id,
                file
            )
            
            if (successful_parts.length != total_number_of_chunks){

                Swal.fire({
                    title: 'Could not retry upload, please try uploading the file again?',
                    icon: 'error',
                    showCancelButton: true,
                    confirmButtonText: 'Yes',
                })
            }

            else{

                complete_mutlipart_upload(
                    uploadId=upload_id,
                    successful_parts=successful_parts
                )
            }
            
        },
        error: function (response) {

            var message = response.message;

            console.log(response)
            console.log(message)

            if (message == "no parts found"){

                payload = {
                    "file_name" : file.name,
                    "file_size" : file_size
                }
                
                alert("I am uploading the normal way because the upload id doesn't exist")
                
                start_file_data_upload(
                    payload,
                    total_number_of_chunks,
                    file_size,
                    file
                )
                
            }
            
        },
    });
    
}


async function retry_failed_uploads(file_size, successful_parts, upload_id,file) {

    upload_promises = [];
    var part_number = 0;

    // start in mb's
    for (let start = 0; start <= file_size; start += chunk_size) {

        part_number += 1;

        // skips the chunk if the part-number exists inside the successful parts list
        if (successful_parts.some(item => item.PartNumber === part_number)) {
            console.log("I skipped this part number",part_number)
            continue;
        }

        try {

            var failed_chunk_start = (part_number - 1) * chunk_size

            var failed_chunk_end = Math.min(part_number * chunk_size, file_size)

            console.log("failed chunk start",failed_chunk_start)
            console.log("failed chunk end",failed_chunk_end)
            console.log("part number",part_number)

            var failed_chunk = file.slice(failed_chunk_start,failed_chunk_end)

            var params = {
                Bucket: bucket_name,
                Key: object_key,
                PartNumber: part_number,
                UploadId: upload_id,
                Body: failed_chunk
            };

            var ETag = await s3.uploadPart(params).promise()

            console.log(ETag)

            var part = {
                ETag: ETag.ETag,
                PartNumber: part_number
            }

            successful_parts.push(part)

            


        } catch (error) {
            console.error("Error retrying upload!!!", error);
        }

    }

    console.log(successful_parts)

    return successful_parts

}


function store_file_data(payload){
    $.ajax({
        type:'POST',
        url:STORE_FILE_DATA_URL,
        data:payload,
    });
}


async function start_file_data_upload(payload,total_number_of_chunks,file_size,file){

    upload_id = await initiate_multipart_upload(
        bucket_name=bucket_name,
        object_key=object_key,
        s3=s3
    )

    payload.upload_id = upload_id;
    payload.csrfmiddlewaretoken = CSRF_TOKEN;

    store_file_data(payload);

    var successful_parts = await uploadParts(
        file=file,
        uploadId=upload_id,
        chunk_size=chunk_size
    );


    if (successful_parts.length != total_number_of_chunks){

        Swal.fire({
            title: 'Some files not uploaded, Do you wish to retry?',
            icon: 'error',
            showCancelButton: true,
            confirmButtonText: 'Yes',
        }).then(async(result) => {

            if (result.isConfirmed) {

                retrieve_uploaded_chunks(
                    upload_id,
                    file_size,
                    total_number_of_chunks,
                    file
                )
            }
        });
    }

    else{

        complete_mutlipart_upload(
            uploadId=upload_id,
            successful_parts=successful_parts
        )
    }
    
}


function get_initial_chunk(){

    var initial_chunk_size;

    if ("connection" in navigator) {

        const network_effective_type = navigator.connection.effectiveType;
        
        initial_chunk_size = get_bandwidth(network_effective_type)
        
    }

    else {
        initial_chunk_size = 5000000 // 5 mb
    }

    return initial_chunk_size;
    
}


function get_bandwidth(network_effective_type){
    var chunk_size;

    if(network_effective_type == "5g"){
        chunk_size = 100000000; // 100mb
    }
    
    else if(network_effective_type == "4g"){
        chunk_size = 10000000; // 10 mb
    }

    else{
        chunk_size = 5000000; //5 mb
    }

    return chunk_size
}


async function upload_initial_chunk(initail_chunk_size,file,upload_id){

    var  start = 0;
    var part_number = 1;

    var end = Math.min(0, start + initail_chunk_size);
    var chunk_data = file.slice(start, end);

    var params = {
        Bucket: bucket_name,
        Key: object_key,
        PartNumber: part_number,
        UploadId: upload_id,
        Body: chunk_data,
    };

    store_chunk_meta_data(
        part_number,
        start,
        end,
        upload_id
    );

    // Record the start time
    // var startTime = Date.now();

    // // Perform the upload
    // var result = await s3.uploadPart(params);

    // // Record the end time
    // var endTime = Date.now();

    // // Calculate latency in milliseconds
    // var latency = endTime - startTime;
    
}


function store_chunk_meta_data(part_number,start,end,upload_id){
    var payload = {
        "part_number":part_number,
        "start":start,
        "end":end,
        "upload_id":upload_id,
    }

    
    $.ajax({
        type:'POST',
        url:STORE_CHUNK_DATA_URL,
        data:payload,
    });
    
}
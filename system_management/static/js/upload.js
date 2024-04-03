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

    object_key = `${object_key}/${file.name}`

    file_already_exists(file,object_key);

});

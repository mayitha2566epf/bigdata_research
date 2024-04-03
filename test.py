import boto3
from decouple import config

def get_uploaded_chunks():

    BUCKET_NAME = config("BUCKET_NAME")
    IDENTITY_POOL_REGION = config("IDENTITY_POOL_REGION")
    IDENTITY_POOL_ID = config("IDENTITY_POOL_ID")

    # Initialize a Cognito identity client
    cognito_identity_client = boto3.client(
        'cognito-identity',
        region_name=IDENTITY_POOL_REGION
    )

    # Replace 'your-identity-pool-id' with your actual Cognito identity pool ID
    identity_pool_id = IDENTITY_POOL_ID

    # Retrieve temporary credentials from Cognito
    temp_credentials = cognito_identity_client.get_id(
        IdentityPoolId=identity_pool_id
    )

    # Extract the identity ID from the response
    identity_id = temp_credentials['IdentityId']

    # Retrieve temporary credentials for accessing S3
    s3_credentials = cognito_identity_client.get_credentials_for_identity(
        IdentityId=identity_id
    )

    aws_access_key_id = s3_credentials['Credentials']['AccessKeyId']
    aws_secret_access_key = s3_credentials['Credentials']['SecretKey']
    aws_session_token = s3_credentials['Credentials']['SessionToken']

    s3_client = boto3.client(
        's3',
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key,
        aws_session_token=aws_session_token
    )

    upload_id = "c5dw4_SVEMUyx7Mz01DX.BzKew_rZQx3Kroq.cS91dg3oB.WOdeqBYJWjR6_7WDe5mtLi89RSntew7Nz20j937zKaI8GJp3F848LvMPKlKvto6BHhPXTs0Paz6sd88JOnKh9yphZi2TOL3gRFBKtdHK2QZ1K4nI84aBQZooGlqI-"
    key = "multipart_files/sample_data_1_million.csv"

    
    response = s3_client.list_multipart_uploads(
        Bucket=BUCKET_NAME
    )

    # Iterate through the multipart uploads and print their IDs
    for upload in response.get('Uploads', []):

        print(upload["Key"])

        response = s3_client.list_parts(
            Bucket=BUCKET_NAME,
            Key=upload["Key"],
            UploadId=upload["UploadId"]
        )
    
        for part in response.get('Parts', []):
            print("Part number:", part['PartNumber'])


get_uploaded_chunks()
import json
import time
import base64
from os import environ
import logging
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)
model_arn = environ.get('MODEL_ARN', 'arn:aws:rekognition:us-east-2:971579260814:project/pixelated-photos-labels/version/pixelated-photos-labels.2025-03-16T02.42.08/1742107328567')
model_version = (model_arn.split("version/", 1)[1]).rpartition('/')[0]
min_confidence = int(environ.get('CONFIDENCE', 50))
s3_client = boto3.client('s3')
rek_client = boto3.client('rekognition')

# ===== CHECK MODEL STATUS =====
def check_model_status(model_arn, model_version):
    response = rek_client.describe_project_versions(
        ProjectArn=model_arn,
        VersionNames=[model_version]
    )
    model_status = response['ProjectVersionDescriptions'][0]['Status']
    return model_status

# ===== WAIT FOR MODEL START =====
def wait_for_model_start(model_arn, model_version, timeout=3600):
    start_time = time.time()
    while True:
        model_status = check_model_status(model_arn, model_version)
        if model_status == 'RUNNING':
            logger.info(f"Model {model_version} is running.")
            break
        elif model_status == 'STARTING':
            logger.info(f"Model {model_version} is starting. Checking again in 30 seconds...")
            time.sleep(30)
        elif model_status == 'FAILED':
             raise Exception(f"Model {model_version} failed to start.")
        else:
             raise Exception(f"Model {model_version} is in an unexpected state: {model_status}")
        if time.time() - start_time > timeout:
            raise TimeoutError(f"Timeout waiting for model {model_version} to start.")

# ===== MAIN FUNCTION =====
def lambda_handler(event, context):
    lambda_response = None
    logger.info("Begin Rekognizing...") 
    logger.info("Event:" + json.dumps(event)) 
    bucket_name = event['Records'][0]['s3']['bucket']['name']
    object_key = event['Records'][0]['s3']['object']['key']
    object_size = event['Records'][0]['s3']['object']['size']

    try:
        # response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
        # response = s3_client.Object(bucket_name, object_key).get()
        # response_object = response['Body'].read()
        # logger.info(f"Successfully retrieved {object_key} from {bucket_name}")

        '''
        # ===== Start Rekognition model =====
        try: 
            rek_start_response = rek_client.start_project_version(
                ProjectVersionArn=model_arn
            )
            logger.info("Model started: {rek_start_response}")
        except Exception as e:
            logger.info(f"Error starting model: {e}")
        '''

        # ===== CHECK REKOGNITION MODEL AND START =====
        try:
            # wait_for_model_start(model_arn, model_version)
            # ===== Model is running, proceed with inference or other tasks =====
            # ===== Analyze the image =====
            logger.info("Trying to Rekognize...")
            labels_response = rek_client.detect_custom_labels(
                ProjectVersionArn = model_arn,
                Image = {
                    # 'Bytes': response_object
                    'S3Object': {
                        'Bucket': bucket_name,
                        'Name': object_key
                    }
                },
                MinConfidence = min_confidence,
            )
            logger.info("Successfully retrieved Rekognition response")
            # ===== Get the custom labels =====
            labels = labels_response['CustomLabels']
            # labels = response['Labels']
            # ===== Print the labels =====
            print("Labels found: " + labels)
            for label in labels:
                logger.info("Label: {label['Name']}, Confidence: {label['Confidence']}")
            logger.info("Success: %s", json.dumps(labels))
            # ===== RETURN CUSTOM LABELS =====
            lambda_response = {
                "statusCode": 200,
                "body": json.dumps(labels)
            }
        except Exception as e:
            logger.error(f"Error: {e}")

        # ===== Stop Rekognition Model =====
        '''
        try:
            response = rek_client.stop_project_version(
                ProjectVersionArn=model_arn
            )
            logger.info(f"Model stopped: {response}")
        except Exception as e:
            logger.error(f"Error stopping model: {e}")
        '''

    except ClientError as err:
        error_message = f"Couldn't analyze image. " + \
            err.response['Error']['Message']
        lambda_response = {
            'statusCode': 400,
            'body': {
                "Error": err.response['Error']['Code'],
                "ErrorMessage": error_message
            }
        }
        logger.error("Error function %s: %s",
            context.invoked_function_arn, error_message)

    except ValueError as val_error:
        lambda_response = {
            'statusCode': 400,
            'body': {
                "Error": "ValueError",
                "ErrorMessage": format(val_error)
            }
        }
        logger.error("Error function %s: %s",
            context.invoked_function_arn, format(val_error))

    return lambda_response


# ===== DOCUMENTATION =====

# GENERAL OVERVIEW
# https://aws.amazon.com/blogs/compute/building-an-image-searching-solution-using-the-aws-cdk/
# https://medium.com/@vjraghavanv/how-to-detect-images-using-amazon-rekognition-aws-lambda-and-s3-3b65bfade24b
# https://aws.amazon.com/blogs/machine-learning/build-your-own-face-recognition-service-using-amazon-rekognition/

# UPLOAD FILES TO AWS S3 VIA CLI
# aws s3 cp '/Volumes/btw-8tb-nas-share/My Photo Library' s3://pixelated-photos/ --recursive
# aws s3 cp '/Volumes/btw-8tb-nas-share/My Photo Library/_photo_album' 's3://pixelated-photos/_photo_album/' --recursive

# LAMBDA S3 TUTORIAL
# https://docs.aws.amazon.com/rekognition/latest/dg/lambda-s3-tutorial-python.html

# ANALYZING IMAGES WITH AWS LAMBDA
# https://docs.aws.amazon.com/rekognition/latest/customlabels-dg/ex-lambda.html

# START AND STOP REKOGNITION MODEL
# https://docs.aws.amazon.com/rekognition/latest/customlabels-dg/rm-start.html

# BOTO3 DOCUMENTATION
# https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/rekognition/client/detect_custom_labels.html

import boto3
import csv
import os
import tempfile

def lambda_handler(event, context):
    table_name = os.environ.get("DYNAMODB_TABLE")
    bucket_name = os.environ.get("S3_BUCKET")
    if not table_name or not bucket_name:
        raise Exception("Environment variables DYNAMODB_TABLE and S3_BUCKET must be set")

    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(table_name)

    # Scan the entire table, handling pagination
    items = []
    scan_kwargs = {}
    while True:
        response = table.scan(**scan_kwargs)
        items.extend(response.get("Items", []))
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break
        scan_kwargs["ExclusiveStartKey"] = last_key

    if not items:
        raise Exception("No items found in DynamoDB table.")

    # Write items to a temporary CSV file
    fieldnames = sorted({key for item in items for key in item.keys()})
    object_key = f"{table_name}.csv"  # Overwrites each time

    with tempfile.NamedTemporaryFile(mode="w", delete=False, newline='', suffix=".csv") as tmp:
        writer = csv.DictWriter(tmp, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(items)
        tmp_path = tmp.name

    # Upload the file to S3 (overwriting existing file)
    s3_client = boto3.client("s3")
    s3_client.upload_file(tmp_path, bucket_name, object_key)

    return {
        "status": "success",
        "records_exported": len(items),
        "s3_bucket": bucket_name,
        "s3_key": object_key,
    }

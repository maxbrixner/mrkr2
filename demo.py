# ---------------------------------------------------------------------------- #

import mrkr.sdk as sdk

# ---------------------------------------------------------------------------- #


with sdk.MrkrClient(log_level="DEBUG") as client:

    # create demo project
    project_id = client.create_project(
        name="Demo Project 6",
        config={
            "label_definitions": [
                {
                    "type": "classification_single",
                    "target": "document",
                    "name": "Letter",
                    "color": "#4CAF50"
                },
                {
                    "type": "classification_single",
                    "target": "document",
                    "name": "Email",
                    "color": "#2196F3"
                },
                {
                    "type": "classification_multiple",
                    "target": "page",
                    "name": "Cover Page",
                    "color": "#FF9800"
                },
                {
                    "type": "classification_multiple",
                    "target": "page",
                    "name": "Attachment",
                    "color": "#F44336"
                },
                {
                    "type": "text",
                    "target": "block",
                    "name": "Name",
                    "color": "#607D8B"
                },
                {
                    "type": "text",
                    "target": "block",
                    "name": "IBAN",
                    "color": "#8BC34A"
                },
                {
                    "type": "text",
                    "target": "block",
                    "name": "Street",
                    "color": "#3F51B5"
                }
            ],
            "file_provider": {
                "type": "local",
                "config": {
                    "path": "demo",
                    "pdf_dpi": 200,
                    "image_format": "WebP",
                    "aws_access_key_id": "{{AWS_ACCESS_KEY_ID}}",
                    "aws_secret_access_key": "{{AWS_SECRET_ACCESS_KEY}}",
                    "aws_region_name": "{{AWS_REGION_NAME}}",
                    "aws_account_id": "{{AWS_ACCOUNT_ID}}",
                    "aws_role_name": "{{AWS_ROLE_NAME}}",
                    "aws_bucket_name": "{{AWS_BUCKET_NAME}}"
                },
            },
            "ocr_provider": {
                "type": "textract",
                "config": {
                    "aws_access_key_id": "{{AWS_ACCESS_KEY_ID}}",
                    "aws_secret_access_key": "{{AWS_SECRET_ACCESS_KEY}}",
                    "aws_region_name": "{{AWS_REGION_NAME}}",
                    "aws_account_id": "{{AWS_ACCOUNT_ID}}",
                    "aws_role_name": "{{AWS_ROLE_NAME}}",
                    "aws_bucket_name": "{{AWS_BUCKET_NAME}}"
                }
            }
        }
    )

    exit(0)

    print(f"Created project with ID: {project_id}")

    # create demo users
    spongebob = client.create_user(
        user={
            "username": "Spongebob",
            "email": "spongebob@example.com",
            "password": "demo_password"
        }
    )

    patrick = client.create_user(
        user={
            "username": "Patrick",
            "email": "patrick@example.com",
            "password": "demo_password"
        }
    )

    squidward = client.create_user(
        user={
            "username": "Squidward",
            "email": "squidward@example.com",
            "password": "demo_password"
        }
    )

    mrkrabs = client.create_user(
        user={
            "username": "Mr. Krabs",
            "email": "mrkrabs@example.com",
            "password": "demo_password"
        }
    )

    sandy = client.create_user(
        user={
            "username": "Sandy",
            "email": "sandy@example.com",
            "password": "demo_password"
        }
    )

    gary = client.create_user(
        user={
            "username": "Gary",
            "email": "gary@example.com",
            "password": "demo_password"
        }
    )

    plankton = client.create_user(
        user={
            "username": "Plankton",
            "email": "plankton@example.com",
            "password": "demo_password"
        }
    )

# ---------------------------------------------------------------------------- #

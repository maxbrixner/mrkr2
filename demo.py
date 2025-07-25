# ---------------------------------------------------------------------------- #

import mrkr.sdk as sdk

# ---------------------------------------------------------------------------- #

with sdk.MrkrClient(url="https://posit-dev.srv.allianz/mrkr2", log_level="DEBUG") as client:

    # create demo project
    project_id = client.create_project(
        name="Demo Project",
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
                    "image_format": "WebP"
                }
            },
            "ocr_provider": {
                "type": "tesseract",
                "config": {
                    "language": "eng"
                }
            }
        }
    )

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

    # list projects
    projects = client.list_projects()
    print("projects:", projects)

    # list documents
    for project in projects:
        documents = client.list_project_documents(
            project_id=project.id
        )
        print(f"Documents for project {project.name}: {documents}")

    # list users
    users = client.list_users()
    print("users:", users)

# ---------------------------------------------------------------------------- #

# Mrkr

A tool to label pages, blocks and text within images and PDF files.

The backend is built with FastAPI, and the frontend uses WebComponents written in TypeScript.

## 1. Getting Started with Development 🚀

### 1.1. Set Up the Environment

Create a virtual environment and install the dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install .
pip install .[dev]
```

Enable Git hooks:

```bash
git config core.hooksPath .githooks
```

Create an environment file:

```bash
cp .env.example .env
```

Install Poppler, Tesseract and any required language packs. A an example, for Arch Linux use:

```bash
sudo pacman -S poppler tesseract tesseract-data-eng tesseract-data-deu
```

### 1.2. Compile TypeScript Components

Compile the TypeScript components for the frontend:

```bash
tsc -p ./frontend/
```

Alternatively, in Visual Studio Code, press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> to build.

### 1.3. Start the Test Database

Add a database password to the `.env` file.  
Use Docker Compose to start the test database. The configuration is located in the `.deploy` folder.

Alternatively, in Visual Studio Code, you can use `Terminal > Run Task` to execute the `build dev database` and `run dev database` tasks.

You may also configure any PostgreSQL database of your choice (or another database that supports JSON data types).

### 1.4. Build Mrkr

Build Mrkr using setuptools:

```bash
python -m build
```

### 1.5. Run Mrkr

You can start the Mrkr server locally in several ways:

- Using Python:

    ```bash
    python -m mrkr
    ```

- Using Uvicorn:

    ```bash
    uvicorn --factory mrkr:create_app --reload --host 0.0.0.0 --port 8000
    ```

- In Visual Studio Code:

    - Press <kbd>Ctrl</kbd>+<kbd>F5</kbd> to start without debugging.
    - Press <kbd>F5</kbd> to start in debug mode.

The Swagger UI is available at [http://localhost:8000/docs](http://localhost:8000/docs), and the GUI is available at [http://localhost:8000/gui/project](http://localhost:8000/gui/project).

## 2. Using Mrkr 🚀

### 2.1. Run Mrkr with Docker

The recommended way to use Mrkr is via Docker, which bundles the application and the database.

1. Create an environment file:

    ```bash
    cp .env.example .env
    ```

2. Enter a database password in the `.env` file.

3. Build and start the Docker container:

    ```bash
    docker compose -f .deploy/docker.app.yaml --env-file .env build
    docker compose -f .deploy/docker.app.yaml --env-file .env up -d
    ```

Alternatively, in Visual Studio Code, you can use `Terminal > Run Task` to execute the `build docker` and `run docker` tasks.

The Swagger UI is available at [http://localhost:8000/docs](http://localhost:8000/docs), and the GUI is available at [http://localhost:8000/gui/project](http://localhost:8000/gui/project).

### 2.2. Use the SDK

Mrkr includes a Software Development Kit (SDK) that allows you to control the Mrkr instance from Python code.  
To use it, simply import `mrkr.sdk`:

```python
import mrkr.sdk as sdk

with sdk.MrkrClient(url="http://localhost:8000") as client:
    # ...
```

You may pass further arguments to the client:

|Argument|Description|
|-|-|
|api_version|The version of the API, e.g. ``"v1"``|
|cert|A certificate to connect to the API, e.g. ``"cert.pem"`` or ``("cert.crt", "cert.key")``|
|proxies|A dictionary of proxies to connect to the API, e.g. ``{"http": "url.com", "https": "url.com"}``|
|timeout|The timeout after a failed request in seconds|
|retry_attempts|The number of retries after a failed request|
|log_level|The logging level of the client, e.g. ``"DEBUG"``|


#### 2.2.1. List Users

List all users:

```python
import mrkr.sdk as sdk

with sdk.MrkrClient(url="http://localhost:8000") as client:
    users = client.list_users()
    print("users:", users)
```

#### 2.2.2. Create a User

Create a new user:

```python
import mrkr.sdk as sdk

with sdk.MrkrClient(url="http://localhost:8000") as client:
    spongebob = client.create_user(
        user={
            "username": "Spongebob",
            "email": "spongebob@example.com",
            "password": "demo_password"
        }
    )
```

#### 2.2.3. List Projects

List all projects:

```python
import mrkr.sdk as sdk

with sdk.MrkrClient(url="http://localhost:8000") as client:
    projects = client.list_projects()
    print("projects:", projects)
```

#### 2.2.4. List Documents

List the documents of a project:

```python
import mrkr.sdk as sdk

with sdk.MrkrClient(url="http://localhost:8000") as client:
    documents = client.list_documents(project_id=1)
    print("documents:", documents)
```

#### 2.2.5. Export a Project (with configurations)

Export a project including its configuration:

```python
import mrkr.sdk as sdk

with sdk.MrkrClient(url="http://localhost:8000") as client:
    project = client.get_project(project_id=1)
    print(f"Project name: {project.name}")
    print(f"Project config: {project.config}")
```

#### 2.2.6. Update a Project's Name

Update the name of a project:

```python
with sdk.MrkrClient(url="http://localhost:8000") as client:
    client.update_project_name(project_id=1, name="New Name")
```

#### 2.2.7. Export a Document (with labels)

Export a document including its labels:

```python
import mrkr.sdk as sdk

with sdk.MrkrClient(url="http://localhost:8000") as client:
    document = client.get_document(document_id=1)
    print(f"Document Labels: {document.data.labels}")

    for page in document.data.pages:
        print(f"Page {page.page} labels: {page.labels}")

        for block in page.blocks:
            print(f"Block contents: {block.content}")
            print(f"Block labels: {block.labels}")
```

#### 2.2.8. Create a Project

Create a new project:

```python
import mrkr.sdk as sdk

with sdk.MrkrClient(url="http://localhost:8000") as client:
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
```

#### 2.9. Update a Project's Configuration

Update the configuration of a project:

```python
with sdk.MrkrClient(url="http://localhost:8000") as client:
    client.update_project_configuration(
        project_id=1,
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
```

Instead of passing a dictionary, you can also use ``sdk.ProjectCreateSchema`` to get type hints.

A label can have the following **targets**:

|Target|Description|
|-|-|
|document|The label targets the whole document|
|page|The label targets a single page within the document|
|block|The label targets a block or text within the block|

A label can have the following **types**:

|Type|Description|
|-|-|
|classification_single|A classification label that unselects all other labels for its target once it is selected|
|classification_multiple|A classification label that allows other classification labels for the same target|
|text|A label that targets a substring within a block|

Text labels can only target blocks!

The following file providers are available:

|Type|Description|Configuration|
|-|-|-|
|local|Serves local files from a folder, e.g. within the Docker container|Expects a ``path`` config variable|

All file providers expect a ``pdf_dpi`` (defaults to 200) and an ``image_format`` (defaults to JPEG).

The following OCR providers are available:

|Type|Description|Configuration|
|-|-|-|
|tesseract|Uses Google's tesseract for OCR.|Expects a ``language`` config variable, e.g. ``eng``or ``deu``|
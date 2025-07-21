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

with sdk.MrkrClient(log_level="DEBUG") as client:
    # Create a demo project
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

    # Scan the demo project
    client.scan_project(project_id=project_id)
    print(f"Scan initiated for project with ID: {project_id}")
```

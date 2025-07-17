# Mrkr

A tool to label pages, blocks and text within images and PDF files.

The backend is based on FastAPI and the frontend uses WebComponents written in TypeScript.

## License

mrkr © 2025 by Max Brixner is licensed under CC BY-NC 4.0.

To view a copy of this license, visit https://creativecommons.org/licenses/by-nc/4.0/ or read the [license file](LICENSE).

## Getting Started 🚀

### 1. Setup Environment

Create a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Enable the GIT hooks:

```bash
git config core.hooksPath .githooks
```

Create an env-file:

```bash
cp .env.example .env
```

You also need to install tesseract and the language packs you might want to use. As an example for ArchLinux:

```bash
sudo pacman -S tesseract tesseract-data-eng
```

### 2. Compile TypeScript Components

Compile the TypeScript components for the frontend:

```bash
tsc -p ./frontend/
```

Or, in Visual Studio Code, press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> to build.

### 3. Start the Test Database

To begin, add a database password to the .env file. Once that's done, use Docker Compose to initiate the test database. The configuration for this can be found in the ``.deploy`` folder.

In Visual Studio Code, you can press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>R</kbd> to access the task runner and execute the tasks ``build dev database`` and ``run dev database``.

Feel free to configure any PostgreSQL database  of your choice (or any other database that supports JSON data types).

### 4. Run Mrkr

You can start the Mrkr server in several ways:

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

### 5. Use the SDK

Mrkr comes with a Software Development Kit (SDK) that let's you control the Mrkr instance from python code. To use it, just import ``mrkr.sdk``.

You can then use the client as follows:

```python
import mrkr.sdk as sdk

with sdk.MrkrClient(log_level="DEBUG") as client:

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

    # scan demo project
    client.scan_project(
        project_id=project_id
    )

    print(f"Scan initiated for project with ID: {project_id}")
```
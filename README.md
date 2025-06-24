# Mrkr

A tool to label pages, blocks and text within images and PDF files

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

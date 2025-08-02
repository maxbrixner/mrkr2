from setuptools import setup, find_packages

setup(
    name="mrkr",
    version="2.0.0b1",
    author="Max Brixner",
    author_email="max.brixner@gmail.com",
    description="A tool to label pages, blocks and text within images and PDF files.",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    license="CC BY-NC-ND 4.0",
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Programming Language :: Python :: 3.13",
        "License :: CC BY-NC-ND 4.0",
        "Operating System :: OS Independent",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Utilities",
    ],
    packages=find_packages(),
    python_requires=">=3.11",
    install_requires=[
        "fastapi>=0.115.12",
        "httpx>=0.28.1",
        "jinja2>=3.1.6",
        "pdf2image>=1.17.0",
        "pydantic>=2.11.5",
        "pydantic[email]>=2.11.5",
        "pytesseract>=0.3.13",
        "psycopg2-binary>=2.9.10",
        "sqlmodel>=0.0.24",
        "requests>=2.32.4",
        "uvicorn>=0.34.2",
        "bcrypt>=4.3.0",
        "boto3>=1.39.13",
        "python-dotenv>=1.1.1"
    ],
    extras_require={
        "dev": [
            "build>=1.2.2",
            "mypy>=1.15.0",
            "setuptools>=59.0.1",
        ]
    },
    url="https://github.com/maxbrixner/mrkr2",
    project_urls={
        "Source": "https://github.com/maxbrixner/mrkr2",
        "Issues": "https://github.com/maxbrixner/mrkr2/issues"
    },
)

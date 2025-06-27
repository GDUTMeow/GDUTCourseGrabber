#!/bin/bash
set -e

CPYTHON_BASE_URL="https://github.com/astral-sh/python-build-standalone/releases/download"
CPYTHON_BUILD_DATE="20250612"
CPYTHON_VERSION="3.12.11"

echo "Downloading CPython..."
curl -sL $CPYTHON_BASE_URL/$CPYTHON_BUILD_DATE/cpython-$CPYTHON_VERSION+$CPYTHON_BUILD_DATE-$CPYTHON_TRIPLE-install_only_stripped.tar.gz | tar xz

echo "Setting up PATH for the OS..."
if [[ "$CPYTHON_TRIPLE" == *"windows"* ]]; then
    export PATH="$(pwd)/python:$PATH"
else
    export PATH="$(pwd)/python/bin:$PATH"
fi

# 验证 python 是否可用
echo "Python command found at: $(which python)"
echo -n "Python version: "
python --version

echo "Installing PDM..."
python -m pip install pdm

echo "Installing packages..."
python -m pdm install --no-self --no-editable --prod --with pack

echo "Running PyInstaller..."
python -m pdm run pyinstaller \
    --name GDUTCourseGrabber \
    --noconfirm \
    --clean \
    --noupx \
    --log-level INFO \
    --add-data "static:static" \
    --hidden-import "uvicorn.logging" \
    --hidden-import "uvicorn.loops" \
    --hidden-import "uvicorn.loops.auto" \
    --hidden-import "uvicorn.protocols" \
    --hidden-import "uvicorn.protocols.http" \
    --hidden-import "uvicorn.protocols.http.auto" \
    --hidden-import "uvicorn.protocols.websockets" \
    --hidden-import "uvicorn.protocols.websockets.auto" \
    --hidden-import "uvicorn.lifespan" \
    --hidden-import "uvicorn.lifespan.on" \
    --hidden-import "uvicorn.lifespan.off" \
    --collect-all "fastapi" \
    --collect-all "pydantic" \
    --collect-all "gdut_course_grabber" \
    --icon="static/img/favicon.ico" \
    --onefile \
    src/gdut_course_grabber/__main__.py

echo "Cleaning up temporary files..."
rm -rf build/ python/ .venv/

echo "Build finished. Check the 'dist' folder."

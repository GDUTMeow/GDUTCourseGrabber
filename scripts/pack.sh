#!/bin/bash
set -e

echo "Running PyInstaller..."
pdm run pyinstaller \
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
    --icon="static/favicon.ico" \
    --onefile \
    src/gdut_course_grabber/__main__.py

echo "Cleaning up PyInstaller temporary files..."
rm -rf build/

echo "Build finished. Check the 'dist' folder."
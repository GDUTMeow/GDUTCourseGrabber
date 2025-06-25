@echo off
chcp 65001

:: 清理上次的构建
echo Cleaning previous builds...
rd /s /q build
rd /s /q dist

:: 运行打包工具
echo Running PyInstaller...
pdm run pyinstaller ^
    --name GDUTCourseGrabber ^
    --noconfirm ^
    --clean ^
    --noupx ^
    --log-level INFO ^
    --add-data "static:static" ^
    --hidden-import "uvicorn.logging" ^
    --hidden-import "uvicorn.loops" ^
    --hidden-import "uvicorn.loops.auto" ^
    --hidden-import "uvicorn.protocols" ^
    --hidden-import "uvicorn.protocols.http" ^
    --hidden-import "uvicorn.protocols.http.auto" ^
    --hidden-import "uvicorn.protocols.websockets" ^
    --hidden-import "uvicorn.protocols.websockets.auto" ^
    --hidden-import "uvicorn.lifespan" ^
    --hidden-import "uvicorn.lifespan.on" ^
    --hidden-import "uvicorn.lifespan.off" ^
    --collect-all "fastapi" ^
    --collect-all "pydantic" ^
    --collect-all "gdut_course_grabber" ^
    --i "static/favicon.ico" ^
    -F src/gdut_course_grabber/__main__.py

:: 将 static 文件夹复制到 dist 目录下
echo Copying static files...
echo "D\n" | xcopy /y /e /i static dist\static

:: 清理 PyInstaller 的临时文件
echo Cleaning up PyInstaller temporary files...
rd /s /q build
rd /s /q dist\GDUTCourseGrabber

echo Build finished. Check the 'dist' folder.
"""
GDUTCourseGrabber 程序入口。
"""

import os

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from gdut_course_grabber import api
from gdut_course_grabber.constants import STATIC_PATH, PLATFORM_DIRS

app = FastAPI()

app.mount("/api", api.app)
app.mount("/", StaticFiles(directory=STATIC_PATH, html=True))

if __name__ == "__main__":
    os.makedirs(PLATFORM_DIRS.user_data_dir, exist_ok=True)
    uvicorn.run(app)

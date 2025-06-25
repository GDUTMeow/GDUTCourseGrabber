"""
GDUTCourseGrabber 程序入口。
"""

import webbrowser

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from gdut_course_grabber import api
from gdut_course_grabber.constants import STATIC_PATH

app = FastAPI()

app.mount("/api", api.app)
app.mount("/", StaticFiles(directory=STATIC_PATH, html=True))

if __name__ == "__main__":
    webbrowser.open("http://127.0.0.1:8000")
    uvicorn.run(app)

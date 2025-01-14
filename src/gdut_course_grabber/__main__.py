"""
GDUTCourseGrabber 程序入口。
"""

import os
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from gdut_course_grabber import api

app = FastAPI()

app.mount("/api", api.app)
app.mount("/", StaticFiles(directory="static", html=True))

if __name__ == "__main__":
    if not os.path.exists("data"):
        os.mkdir("data")
    uvicorn.run(app)

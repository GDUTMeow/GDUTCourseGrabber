"""
GDUTCourseGrabber 程序入口。
"""

import webbrowser
import socket

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from gdut_course_grabber import api
from gdut_course_grabber.constants import STATIC_PATH


app = FastAPI()

app.mount("/api", api.app)
app.mount("/", StaticFiles(directory=STATIC_PATH, html=True))

if __name__ == "__main__":
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        sock.listen()

        port = sock.getsockname()[1]
        config = uvicorn.Config(app, host="localhost", port=port)
        server = uvicorn.Server(config=config)
        
        webbrowser.open(f"http://localhost:{port}")
        server.run(sockets=[sock])

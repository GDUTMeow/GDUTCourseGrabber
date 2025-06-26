"""
GDUTCourseGrabber 程序入口。
"""

import socket
import webbrowser

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from gdut_course_grabber import api
from gdut_course_grabber.context.path import static_path

app = FastAPI()

app.mount("/api", api.app)
app.mount("/", StaticFiles(directory=static_path, html=True))

if __name__ == "__main__":
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        sock.listen()

        port = sock.getsockname()[1]
        config = uvicorn.Config(app, host="localhost", port=port)
        server = uvicorn.Server(config=config)

        webbrowser.open(f"http://localhost:{port}")
        server.run(sockets=[sock])

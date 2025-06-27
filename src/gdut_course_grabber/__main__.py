"""
GDUTCourseGrabber 程序入口。
"""

import contextlib
import logging
import socket
import webbrowser

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from gdut_course_grabber import api
from gdut_course_grabber.context.path import static_path

logger = logging.getLogger(__name__)

app = FastAPI()

app.mount("/api", api.app)
app.mount("/", StaticFiles(directory=static_path, html=True))

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    with (
        socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock4,
        socket.socket(socket.AF_INET6, socket.SOCK_STREAM) as sock6,
    ):
        sock4.bind(("127.0.0.1", 0))
        sock4.listen()

        port = sock4.getsockname()[1]

        sock6.bind(("::1", port))
        sock6.listen()

        config = uvicorn.Config(app, host="localhost", port=port)
        server = uvicorn.Server(config=config)

        url = f"http://localhost:{port}"

        logger.info("server running on %s", url)
        webbrowser.open(url)

        with contextlib.suppress(KeyboardInterrupt):
            server.run(sockets=[sock4, sock6])

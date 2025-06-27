FROM python:3.12-slim

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir pdm && \
    python -m pdm install

RUN ls -la

RUN ls -la /app

CMD ["python", "-m", "pdm", "run", "src/gdut_course_grabber/__main__.py"]
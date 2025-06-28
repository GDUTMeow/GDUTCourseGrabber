FROM python:3.12-slim

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir pdm && \
    python -m pdm install

CMD ["python", "-m", "gdut_course_grabber"]
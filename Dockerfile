FROM tiangolo/uwsgi-nginx:python3.6

RUN apt-get update && apt-get install -y imagemagick tesseract-ocr tesseract-ocr-nld \
    && rm -rf /var/lib/apt/lists/*

COPY  . /app
RUN pip install -r /app/requirements.txt




FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpng-dev libjpeg-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "3", "--timeout", "120", "--worker-class", "sync", "--max-requests", "1000", "--max-requests-jitter", "100", "run:app"]

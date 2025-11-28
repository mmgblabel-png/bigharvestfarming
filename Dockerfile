# Big Harvest Farming Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY web_app.py /app/web_app.py
COPY static /app/static
COPY game_state.json /app/game_state.json

# Expose
EXPOSE 8000

# Run with gunicorn
CMD ["python", "-m", "gunicorn", "web_app:app", "--bind", "0.0.0.0:8000"]

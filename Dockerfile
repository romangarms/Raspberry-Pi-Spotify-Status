# Multi-stage build for Flask + React app

# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm ci

# Copy source files
COPY src/ ./src/
COPY index.html ./
COPY vite.config.js ./

# Build React app
RUN npm run build

# Stage 2: Python Flask app
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy Flask app
COPY app.py .
COPY templates/ ./templates/
COPY static/css/ ./static/css/
COPY static/favicon.png ./static/

# Copy React build from previous stage
COPY --from=frontend-builder /app/static/react-build ./static/react-build

# Set environment variables
ENV FLASK_APP=app.py
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8080

# Run with gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--threads", "2", "--timeout", "120", "app:app"]
# backend/Dockerfile
# ──────────────────────────────────────────────
# Builds the Python FastAPI backend container.
# Each line is an instruction Docker runs
# to build the container image.
# ──────────────────────────────────────────────

# Start from official Python image (slim = smaller size)
FROM python:3.11-slim

# Set working directory inside the container
WORKDIR /app

# Copy requirements first (Docker caches this layer)
# If requirements don't change, this layer is reused = faster builds
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Expose port 8000 so Docker knows this container listens here
EXPOSE 8000

# Command to run when container starts
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

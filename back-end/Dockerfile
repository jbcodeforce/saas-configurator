# Use Python 3.12 slim image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv package manager and add to PATH
RUN curl -LsSf https://astral.sh/uv/install.sh | sh && \
    echo 'export PATH="/root/.local/bin:$PATH"' >> ~/.bashrc && \
    . ~/.bashrc

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Copy application code
COPY . .

# Install dependencies using absolute path to uv
RUN /root/.local/bin/uv sync

# Expose port
EXPOSE 8000

# Run the application with uvicorn
CMD ["/root/.local/bin/uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Use an official Python runtime as a parent image
FROM python:3.9

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install dependencies with increased timeout and retries, using a mirror
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt --timeout=120 --retries=5 --index-url=https://pypi.org/simple

# Copy the rest of the application code into the container
COPY . .

# Install Node.js and npm (ensure the latest version is installed)
RUN apt-get update \
    && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_16.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install npm dependencies
RUN npm install

# Command to run the application
CMD ["python", "src/main.py"]

# docker/backend/Dockerfile
FROM python:3.9

# Build argument for environment
ARG BUILD_ENV=dev

# Environment variables
ENV PYTHONUNBUFFERED 1
ENV ENV_MODE ${BUILD_ENV}

# Install requirements
ADD ./deploy/requirements.txt /tmp
RUN /usr/local/bin/python -m pip install --upgrade pip && \
    /usr/local/bin/python -m pip install --no-cache-dir -r /tmp/requirements.txt

# Install Chrome
RUN apt-get update -y && apt-get install -y \
        wget \
        unzip \
        curl \
        gnupg \
    && wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && apt-get install -y ./google-chrome-stable_current_amd64.deb \
    && rm google-chrome-stable_current_amd64.deb \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Add application
ADD . /app
WORKDIR /app

# Collect static files
RUN echo yes | python manage.py collectstatic

# Run server
CMD python manage.py runserver 0.0.0.0:8000

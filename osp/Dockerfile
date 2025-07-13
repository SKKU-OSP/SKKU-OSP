# Base Image
FROM python:3.9

# Environment variables
ENV PYTHONUNBUFFERED 1
ENV ENV_MODE DEV

# Maintainer information
ADD ./deploy/requirements.txt /tmp

# Install requirements
RUN /usr/local/bin/python -m pip install --upgrade pip 
RUN pip install --no-cache-dir -r /tmp/requirements.txt

RUN apt-get update -y && apt-get install -y \
    wget \
    unzip \
    curl \
    gnupg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install specific version of Google Chrome
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && apt-get update \
    && apt-get install -y ./google-chrome-stable_current_amd64.deb \
    && rm google-chrome-stable_current_amd64.deb


# ADD Secret when secret.key does not exist.
# ARG DATA=/data
# RUN mkdir -p ${DATA}/config
# RUN if [ ! -f "${DATA}/config/secret.key" ] ; then echo $(cat /dev/urandom | head -1 | md5sum | head -c 32) > "${DATA}/config/secret.key" ; fi

ADD . /app

WORKDIR /app
# Migrate
# RUN python manage.py migrate
RUN echo yes | python manage.py collectstatic
CMD python manage.py runserver 0.0.0.0:8000
#CMD python manage.py runserver 0.0.0.0:8000
EXPOSE 8000
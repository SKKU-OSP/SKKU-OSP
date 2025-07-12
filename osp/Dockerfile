# Base Image
FROM python:3.9

# Environment variables
ENV PYTHONUNBUFFERED 1
ENV ENV_MODE PRODUCT

# Maintainer information
ADD ./deploy/requirements.txt /tmp

# Install requirements
RUN /usr/local/bin/python -m pip install --upgrade pip && \
    pip install --no-cache-dir -r /tmp/requirements.txt

# ADD Secret when secret.key does not exist.
# ARG DATA=/data
# RUN mkdir -p ${DATA}/config
# RUN if [ ! -f "${DATA}/config/secret.key" ] ; then echo $(cat /dev/urandom | head -1 | md5sum | head -c 32) > "${DATA}/config/secret.key" ; fi

ADD . /app

WORKDIR /app

CMD echo yes | python manage.py collectstatic & python manage.py runserver 0.0.0.0:4401

EXPOSE 4402
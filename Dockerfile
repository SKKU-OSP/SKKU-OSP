FROM python:3.9

ADD ./osp/deploy/requirements.txt /tmp

RUN /usr/local/bin/python -m pip install --upgrade pip \ 
    pip install --no-cache-dir -r /tmp/requirements.txt

EXPOSE 8081

ENV PYTHONUNBUFFERED 1

ENV ENV_MODE production

ARG DATA=/data

RUN mkdir -p ${DATA}/config

RUN if [ ! -f "${DATA}/config/secret.key" ] ; then echo $(cat /dev/urandom | head -1 | md5sum | head -c 32) > "${DATA}/config/secret.key" ; fi

ADD ./osp /app

WORKDIR /app

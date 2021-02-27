FROM ubuntu:latest

RUN apt-get update -y

ADD ./heroku-exec.sh /app/.profile.d/
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# Install docker in docker

# Install neo4j

# Install nodejs

CMD bash heroku-exec.sh && node app.js

FROM node:6.9.1
MAINTAINER grant@fugitivelabs.com

RUN npm install -g forever

ADD / ./yote

RUN cd /yote && npm rebuild node-sass node-sass-middleware winston-mongodb 
# RUN cd /yote && npm install @google-cloud/logging

EXPOSE 80

CMD forever /yote/yote.js
FROM node:10
LABEL maintainer="noogen <friends@niiknow.org>"
ENV NPM_CONFIG_LOGLEVEL=warn \
  APP_VERSION=1.0.0
EXPOSE 5000

RUN apt-get update && apt-get upgrade -y \
  && apt-get install git -y \
  && npm install -g pm2 \
  && mkdir -p /usr/local/gtincloud \
  && groupadd -r gtincloud && useradd -r -g gtincloud -d /usr/local/gtincloud gtincloud \
  && chown gtincloud:gtincloud /usr/local/gtincloud \
  && apt-get clean -y && apt-get autoclean -y \
  && apt-get autoremove --purge -y \
  && rm -rf /var/lib/apt/lists/* /var/lib/log/* /tmp/* /var/tmp/*

USER gtincloud
RUN cd /usr/local/gtincloud \
  && git clone https://github.com/niiknow/gtin-cloud --branch ${APP_VERSION} /usr/local/gtincloud/app \
  && cd app && npm install
WORKDIR /usr/local/gtincloud/app

CMD ["npm", "run", "prod"]

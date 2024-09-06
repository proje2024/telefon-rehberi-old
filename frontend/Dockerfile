FROM node:14 AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

COPY .env /usr/src/app/.env

RUN npm run build

FROM nginx:stable-alpine

COPY --from=build /usr/src/app/build /usr/share/nginx/html

COPY nginx/nginx.default.conf  /etc/nginx/conf.d/default.conf.template

CMD envsubst '${NGINX_HOST} ${NGINX_PORT} ${NGINX_LISTEN} ${NGINX_SERVER_NAME}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && cat /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'

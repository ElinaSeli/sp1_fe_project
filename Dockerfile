FROM nginx:alpine

COPY .output/public /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s CMD wget -qO- http://localhost || exit 1

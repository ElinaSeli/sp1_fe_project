FROM node:22-alpine

WORKDIR /app

COPY .output /app/.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]

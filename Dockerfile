FROM node:22-alpine3.21

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

COPY .output /app/.output

RUN chown -R app:app /app

USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost:3000 || exit 1

CMD ["node", ".output/server/index.mjs"]

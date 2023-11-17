FROM node:14

WORKDIR /app

COPY . .

RUN npm install
RUN npx sequelize-cli db:create

EXPOSE 3000

CMD ["node", "server/app.js"]

FROM node:20-alpine
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
RUN npm install -g tsx

# Source code mounted as volume, no need to COPY in dev
EXPOSE 8000
CMD ["npm", "run", "dev"]


# run this to execute npm i in docker
# docker compose exec backend npm install
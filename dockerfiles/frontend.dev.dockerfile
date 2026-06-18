FROM node:20-alpine
WORKDIR /usr/src/frontend

COPY package*.json ./
RUN npm install
RUN npm install -g vite

# Source code mounted as volume, no need to COPY in dev
EXPOSE 5173
CMD ["npm", "run", "dev"]

FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_FIREBASE_VAPID_KEY

ENV VITE_FIREBASE_VAPID_KEY=$VITE_FIREBASE_VAPID_KEY

RUN npm run build


FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Set after install/build, not before — typescript (tsc) lives in
# devDependencies, and npm skips devDependencies when NODE_ENV=production
# is already set at install time.
ENV NODE_ENV=production

EXPOSE 8083

# CMD ["node", "dist/server.js"]
# CMD ["npx", "pm2-runtime", "ecosystem.config.cjs"]
CMD ["./node_modules/.bin/pm2-runtime", "ecosystem.config.cjs"]
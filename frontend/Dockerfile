# Base stage with Alpine for a smaller image
FROM node:18-alpine as build
WORKDIR /app

# Install dependencies separately to leverage caching
COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

# Copy source files and build React app
COPY . .
RUN npm run build

# Use lightweight Nginx to serve the React app
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

# Copy optimized Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 and start Nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


FROM node:12.10

# Create app directory
RUN mkdir -p /app /tor

ENV APP_DIR /app
WORKDIR $APP_DIR

# Copy over project
COPY . /app
RUN rm -r node_modules quick_queries
RUN rm new_file.json sephora-fetch-queue

# Install dependencies

RUN npm install --production




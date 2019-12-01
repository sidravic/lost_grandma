FROM node:12.10

# Create app directory
RUN mkdir -p /app /tor
RUN apt-get -y update && apt-get install -y nmap telnet vim

ENV APP_DIR /app
WORKDIR $APP_DIR

# Copy over project
COPY . /app
#RUN rm -r node_modules quick_queries

# Install dependencies

RUN npm install --production




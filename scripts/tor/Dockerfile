FROM node:12.10

ENV TOR_DIR /tor
WORKDIR $TOR_DIR

COPY . $TOR_DIR

RUN ./download_tor.sh
#
COPY sample_torrc /etc/tor/torrc
#
EXPOSE 9050
EXPOSE 9051
EXPOSE 9080
#
CMD ['./launch_tor.sh']

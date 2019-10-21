#!/bin/sh

cd $TOR_DIR && \
   wget https://www.torproject.org/dist/torbrowser/8.5.5/tor-browser-linux64-8.5.5_en-US.tar.xz

cd $TOR_DIR && tar -xvf tor-browser-linux64-8.5.5_en-US.tar.xz

apt-get -y update

apt-get install -y apt-transport-https curl ca-certificates

echo "deb https://deb.torproject.org/torproject.org stretch main" | tee -a /etc/apt/sources.list
echo "deb-src https://deb.torproject.org/torproject.org stretch main" | tee -a /etc/apt/sources.list

curl https://deb.torproject.org/torproject.org/A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89.asc | gpg --import
gpg --export A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89 | apt-key add -

apt-get -y update
#
#apt-get install -y apt-transport-https curl ca-certificates
#
apt-get install -y tor



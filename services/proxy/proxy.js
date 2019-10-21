const url = require('url');
const http = require('http');
const https = require('https')
const axios = require('axios');
const SocksProxyAgent = require('socks-proxy-agent');


// HTTP/HTTPS proxy to connect to

const proxy = 'socks5://127.0.0.1:9050';
const httpsAgent = new SocksProxyAgent(proxy);

// Global configuration for all client requests with http/https library.
httpsAgent.protocol = 'https:'
https.globalAgent = httpsAgent;

module.exports.SocksAgent = httpsAgent;
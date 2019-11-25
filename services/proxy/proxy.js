const url = require('url');
const http = require('http');
const https = require('https')
const axios = require('axios');
const SocksProxyAgent = require('socks-proxy-agent');


// HTTP/HTTPS proxy to connect to

const proxy = process.env.TOR_URL;
const httpsAgent = new SocksProxyAgent(proxy);

const httpAgent = new SocksProxyAgent(proxy);

// Global configuration for all client requests with http/https library.
httpsAgent.protocol = 'https:'
// https.globalAgent = httpsAgent;

httpAgent.protocol = 'http:';
// http.globalAgent = httpAgent;

module.exports.SocksAgent = httpsAgent;
module.exports.SocksHttpAgent = httpAgent;
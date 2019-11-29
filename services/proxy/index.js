const {SocksAgent, SocksHttpAgent} = require('./proxy');
const { recreateCircuit, checkNewCircuitIp} = require('./tor_change_circuit');

module.exports.SocksAgent = SocksAgent;
module.exports.SocksHttpAgent = SocksHttpAgent;
module.exports.recreateCircuit = recreateCircuit;
module.exports.checkNewCircuitIp = checkNewCircuitIp;
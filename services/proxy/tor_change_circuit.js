const logger = require('../../config/logger');
const util = require('util');
const exec = require('child_process').exec;
const asyncExec = util.promisify(exec)

const recreateCircuits = async () => {
    const command = '(echo authenticate \'""\'; echo signal newnym; echo quit) | nc localhost 9051'
    const {stdout, stderr} = await asyncExec(command)
    logger.info({
        event: 'recreateCircuits',
        command: '(echo authenticate \'""\'; echo signal newnym; echo quit) | nc localhost 9051',
        stderr: stderr,
        stdout: stdout
    })
}

const checkNewCircuitIp = async () => {
    const command = 'curl --socks5 127.0.0.1:9050 http://checkip.amazonaws.com/'
    const {stdout, stderr} = await asyncExec(command);
    const newIp = stdout.trim();
    logger.info({event: 'checkNewCircuitIp', newIP: newIp, stderr: stderr})
    return;
}


const main = async () => {
    await recreateCircuits();
    await checkNewCircuitIp();
}

module.exports.recreateCircuit = recreateCircuits;
module.exports.checkNewCircuitIp = checkNewCircuitIp;
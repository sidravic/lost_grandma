const fs = require('fs').promises

const writeToFile = async (filename, data) => {
    await fs.writeFile(filename, data)
}

const mkdir = async (dirPath) => {
    if(fs.existsSync(dirPath)) return

    return fs.mkdirSync(dirPath)
}

module.exports.writeToFile = writeToFile;
module.exports.mkdir = mkdir
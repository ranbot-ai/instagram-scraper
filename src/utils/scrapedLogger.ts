const path = require("path");
const fs = require('fs-extra');
const util = require('util');

const serverLogPath = path.resolve(__dirname, './../../log/development.log');
let log_file = fs.createWriteStream(serverLogPath, { flags : 'a' });

const scrapedLogging = (text: any) => {
  log_file.write(util.format(text) + '\n');
}

export { scrapedLogging };
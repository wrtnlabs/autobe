const fs = require("fs");
const path = require("path");

const licensePath = path.join(__dirname, "../../../LICENSE");
const targetPath = path.join(__dirname, "../LICENSE");

if(fs.existsSync(targetPath)) {
  return;
}
fs.copyFileSync(licensePath, targetPath);

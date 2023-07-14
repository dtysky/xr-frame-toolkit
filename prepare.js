const fs = require('fs');
const path = require('path');

['dist', 'out'].forEach(dir => {
  dir = path.resolve(__dirname, dir);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, {recursive: true, force: true});
  }
});

fs.mkdirSync(path.resolve(__dirname, 'dist/common'), {recursive: true});
fs.copyFileSync(
  path.resolve(__dirname, 'src/service/common/tinyexr.wasm'),
  path.resolve(__dirname, 'dist/common/tinyexr.wasm')
);

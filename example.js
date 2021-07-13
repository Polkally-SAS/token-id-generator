const TokenIdGen = require(__dirname+"/src/index.js")

let tokenIdGen = new TokenIdGen("private key");

tokenIdGen.getId().then(console.log)
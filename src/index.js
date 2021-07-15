/**
 * polkally data signer
 */
const fsp = require("fs/promises")
const path = require("path")
const ethers = require("ethers")
const EthCrypto = require("eth-crypto")


const tokenIdLogFile = path.join(__dirname,".token_id");

module.exports = class TokenIdGenerator {

    web3 = null;
    privateKey = null;
    web3Account = null;
    
    constructor(privateKey){
        this.privateKey = privateKey;
    }

    async _getNextId() {
        //lets get current id
        let currentId;
        
        try{ currentId = (await fsp.readFile(tokenIdLogFile,{encoding: 'utf8'})).trim() } catch(e){}

        if(!currentId || currentId == NaN || currentId == ""){
            currentId = 0;
        } else {
            currentId = Number(currentId)
        }

        let nextId = currentId + 1;

        //lets save to file
        await fsp.writeFile(tokenIdLogFile, nextId.toString());

        return nextId;
    }

    async getId(){

        //lets get the next id 
        let nextId = (await this._getNextId());

        let nextIdBN = ethers.BigNumber.from(nextId.toString())

        const messageHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["uint256"],[ nextIdBN ]));
                
        const sig   = EthCrypto.sign(this.privateKey,  messageHash);

        const v   = parseInt(sig.slice(130, 132), 16);

        const vBN = ethers.BigNumber.from(v);

        let parsedResult = {
            r: sig.slice(0, 66),
            s: '0x' + sig.slice(66, 130),
            v: vBN,
            tokenId: nextId,
            signature: sig
        };

        return parsedResult;
    } //end fun 



}


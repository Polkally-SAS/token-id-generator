/**
 * polkally data signer
 */
const fsp = require("fs/promises")
const path = require("path")
//const ethSignUtil = require("eth-sig-util")
//const Web3 = require("web3")
var ethUtil = require('ethereumjs-util');

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
        let nextId = (await this._getNextId()).toString();

        let pkBuffer = Buffer.from(this.privateKey, 'hex')

        const nextIdHex = ethUtil.addHexPrefix(this.padWithZeroes(ethUtil.stripHexPrefix(ethUtil.intToHex(nextId)), 64));
        const message = ethUtil.keccakFromHexString(nextIdHex);

        //const message = Buffer.from(nextId);
        
        const msgHash = ethUtil.hashPersonalMessage(message);
        const sig     = ethUtil.ecsign(msgHash, pkBuffer);

        
        var pub = ethUtil.ecrecover(msgHash, sig.v, sig.r, sig.s);
        
        var recoveredAddress = '0x' + ethUtil.pubToAddress(pub).toString('hex')

        let accounAddress = "0x"+ethUtil.privateToAddress(pkBuffer).toString("hex")

        if(accounAddress != recoveredAddress){
            throw new Error("Failed to verify signed data")
        }

        //console.log("recoveredAddress ===>>", recoveredAddress, "==", accounAddress)

        let parsedResult = {
            v: sig.v,
            r: ethUtil.bufferToHex(sig.r), 
            s: ethUtil.bufferToHex(sig.s),
            tokenId: Number(nextId),
            signature: ethUtil.bufferToHex(this.concatSig(sig.v, sig.r, sig.s))
        };


        return parsedResult;
    } //end fun 


    concatSig(v, r, s) {
        const rSig = ethUtil.fromSigned(r);
        const sSig = ethUtil.fromSigned(s);
        const vSig = ethUtil.bufferToInt(v);
        const rStr = this.padWithZeroes(ethUtil.toUnsigned(rSig).toString('hex'), 64);
        const sStr = this.padWithZeroes(ethUtil.toUnsigned(sSig).toString('hex'), 64);
        const vStr = ethUtil.stripHexPrefix(ethUtil.intToHex(vSig));
        return ethUtil.addHexPrefix(rStr.concat(sStr, vStr)).toString('hex');
    }

    padWithZeroes(number, length) {
        let myString = `${number}`;
        while (myString.length < length) {
          myString = `0${myString}`;
        }
        return myString;
    }

}


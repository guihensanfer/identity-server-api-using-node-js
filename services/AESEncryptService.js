const crypto = require('crypto');
const util = require('../services/utilService');

// How to use
// Encypt the user the code and tokens. Get the credencials
// const {encryptionAESKey, encryptionAESIV} = await Projects.getProjectAESEncryptCredentials(projectId);
// Instance the AesClass
// const encrypt = new AESEncrypt(encryptionAESKey, encryptionAESIV);
// const encryptedString = encrypt.encrypt('my string');
class AESEncrypt {    
    constructor(key, iv) {
        if (!key || !iv) {
            throw new Error('Key and IV are required');
        }
        this.algorithm = 'aes-256-cbc';
        this.key = Buffer.from(key, 'hex');
        this.iv = Buffer.from(iv, 'hex');
    }

    static generateAESKeyAndIV() {
        const key = crypto.randomBytes(32); // 256-bit key for AES-256
        const iv = crypto.randomBytes(16);  // 128-bit IV
        return {
            key: key.toString('hex'),
            iv: iv.toString('hex')
        };
    }
    
    // Método para criptografar os dados
    encrypt(text) {
        const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    // Método para descriptografar os dados
    decrypt(encryptedText) {
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}

module.exports = AESEncrypt;

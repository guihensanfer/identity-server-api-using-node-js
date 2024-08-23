const crypto = require('crypto');

class AESEncrypt {
    constructor(algorithm = 'aes-256-cbc', key, iv) {
        if (!key || !iv) {
            throw new Error('Key and IV are required');
        }
        this.algorithm = algorithm;
        this.key = key;
        this.iv = iv;
    }

    encrypt(text) {
        let cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.key), this.iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return encrypted.toString('hex');
    }

    decrypt(encryptedText) {
        let encryptedTextBuffer = Buffer.from(encryptedText, 'hex');
        let decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(this.key), this.iv);
        let decrypted = decipher.update(encryptedTextBuffer);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }
}

module.exports = AESEncrypt;

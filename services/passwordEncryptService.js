const bcrypt = require('bcrypt');

class Cryptography {
    constructor(saltRounds = 12) {
        this.saltRounds = saltRounds;
    }

    async encryptPassword(password) {
        const salt = await bcrypt.genSaltSync(this.saltRounds);
        const passwordHash = await bcrypt.hashSync(password, salt);
        return passwordHash;
    }
    
    async comparePassword(password, hash) {
        if(!hash)
            return false;

        const match = await bcrypt.compareSync(password, hash);
        return match;
    }
}

module.exports = new Cryptography();

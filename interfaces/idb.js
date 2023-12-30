class idb {
    constructor(ticket) {
        if (new.target === idb) {
            throw new TypeError("Cannot instantiate abstract class");
        }
        
        this.ticket = ticket;
    }


}

module.exports = idb;
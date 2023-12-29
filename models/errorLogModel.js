const { v4: uuidv4 } = require('uuid');

class ErrorLogModel {
    constructor(
        errorMessage,
        errorCode,
        errorSeverity,
        errorSource,
        errorDetails,
        userID,
        ipAddress,
        ticket
    ) 
    {
        this.errorMessage = errorMessage;
        this.errorCode = errorCode;
        this.errorSeverity = errorSeverity;
        this.errorSource = errorSource;
        this.errorDetails = errorDetails;
        this.userID = userID;
        this.ipAddress = ipAddress;        
        this.ticket = ticket            
    }    

    static DefaultForEndPoints(req, err) {
        let ticket = uuidv4();       

        return new ErrorLogModel(
            req.path,
            0,
            3,
            err.message + err.stack,
            req.body ?? null,
            req.user ? req.user.id : null,
            req.ip,
            ticket
        );
    }
}

module.exports = ErrorLogModel;
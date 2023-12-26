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
}

module.exports = ErrorLogModel;
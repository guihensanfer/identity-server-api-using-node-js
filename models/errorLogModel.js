const _ = require('lodash');

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

    static DefaultForEndPoints(req, err, ticket = 'default') {    
        let errorDetails = req.body;

        if(_.isNull(errorDetails) || _.isEmpty(errorDetails)){
            if(err.response && err.response.data){
                errorDetails = JSON.stringify(err.response.data);
            }
        }
        
        return new ErrorLogModel(
            req.path,
            err.response?.status ?? 0,
            3,
            (err.message ?? err.cause) + err.stack,
            errorDetails,
            req.user ? req.user.id : null,
            req.ip,
            ticket
        );
    }

    static DefaultForSequelize(methodName, err, ticket = 'default') {
        let errorDetails = null;
    
        if (err.errors && err.errors.length > 0) {            
            errorDetails = err.errors.map(error => ({
                message: error.message,
                field: error.path,
                value: error.value
            }));
        } else if (err.original && err.original.message) {            
            errorDetails = err.original.message;
        }
            
        return new ErrorLogModel(
            methodName,
            err.status || 0,
            3,
            (err.message || err.cause) + (err.stack || ''),
            errorDetails ? JSON.stringify(errorDetails) : null,
            null,
            null,
            ticket
        );
    }
    
}

module.exports = ErrorLogModel;
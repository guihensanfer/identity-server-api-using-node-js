const { v4: uuidv4 } = require('uuid');
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

    static DefaultForEndPoints(req, err, ticket = null) {    
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
            ticket ?? uuidv4()
        );
    }
}

module.exports = ErrorLogModel;
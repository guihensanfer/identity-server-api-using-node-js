const { v4: uuidv4 } = require('uuid');
const DEFAULT_PAGE = 1;
const PAGE_SIZE = 15;
const _ = require('lodash');
const jwt = require('jsonwebtoken');

class HTTPResponsePatternModel{
    constructor(){
        this.message = '';
        this.success = false;
        this.errors = [];
        this.data = [];
        this._statusCode = 0;    
        this.ticket = uuidv4(); 
    }    

    getTicket() {
        return this.ticket;
    }
    
    getStatusCode(){
        return this._statusCode;
    }

    set(statusCode,        
        success,
        errors = null,
        data = null,
        message = null)
    {
        this.message = message;
        this.success = success;
        this.errors = errors;
        this.data = data;
        this._statusCode = statusCode;
        
        if(!message){
            const statusDescription = HTTPResponsePatternModel.getDescByStatusCode(this._statusCode);

            this.message = statusDescription;
            if(this.success == false && (!this.errors || (Array.isArray(this.errors) && this.errors.length <= 0))){
                this.errors = [statusDescription];
            }
        }
    }

    setPagging(currentPage, totalPages){
        if(currentPage)
        this.currentPage = currentPage;
    
        if(totalPages)
            this.totalPages = totalPages;
    }

    setNonPagging(){
        this.totalPages = null;
        this.currentPage = null;
    }

    async sendResponse(res) {
        return new Promise((resolve, reject) => {
            let response = { 
                message: this.message,
                ticket: this.ticket,
                success: this.success,
                errors: this.errors,
                data: this.data
            };
            
      
            if(this.currentPage){
              response.currentPage = this.currentPage;
            }
      
            if(this.totalPages){
              response.totalPages = this.totalPages;
            }
                        
            res.status(this._statusCode).json(response);
            resolve();
        });
    }

    static auth(roles) {
        return (req, res, next) => {
          let authHeader = req.headers['authorization'];          

          const fnUnauthorized = function(){            
            let response = new HTTPResponsePatternModel();

            response.set(401, false);
            return response.sendResponse(res);
          };
      
          if (_.isNull(authHeader) || _.isEmpty(authHeader)) {
            return fnUnauthorized();
          }
      
          let token = authHeader.split(' ')[1];
      
          if (!token) {
            return fnUnauthorized();
          }
      
          try {
            let secret = process.env.SECRET;
      
            jwt.verify(token, secret, (err, decoded) => {
              if (err || !decoded.roles || decoded.roles.length === 0) {
                return fnUnauthorized();
              }
      
              let userRoles = Array.isArray(decoded.roles) ? decoded.roles.flat() : [decoded.roles];
      
              let hasPermission = roles.some(role => userRoles.includes(role));
      
              if (!hasPermission) {
                return fnUnauthorized();
              }
              
              req.user = decoded;
              next();
            });
          } catch {
            return fnUnauthorized();
          }
        };
    }


    static getUserIdByRefreshToken(checkRefreshToken) {
      let token = checkRefreshToken;      
    
      if (!token) {
        return 0;
      }
  
      try {
        let secret = process.env.SECRET_FOR_REFRESH;
  
        jwt.verify(token, secret, (err, decoded) => {
          if (err) {
            return 0;
          }    

          return decoded.userId;
        });
      } catch {
        return 0;
      }
  }

    static getDescByStatusCode(statusCode){
        const statusDescriptions = [
            {
              statusCode: 200,
              description: "Request was successful."
            },
            {
              statusCode: 201,
              description: "Resource was successfully created."
            },
            {
              statusCode: 204,
              description: "Request was successful, but no content to return."
            },
            {
              statusCode: 400,
              description: "Bad request. The request cannot be fulfilled due to bad syntax."
            },
            {
              statusCode: 401,
              description: "Unauthorized. Authentication is required and has failed or has not yet been provided."
            },
            {
              statusCode: 403,
              description: "Forbidden. The server understood the request but refuses to authorize it."
            },
            {
              statusCode: 404,
              description: "Not found. The requested resource could not be found but may be available in the future."
            },
            {
                statusCode: 422,
                description: "Unprocessable entity, the provided data is not valid."
            },
            {
              statusCode: 500,
              description: "Try again later."
            }
        ];
          
        const foundStatus = statusDescriptions.find(status => status.statusCode === statusCode);

        if (foundStatus)
            return foundStatus.description;
            
        return "Unknown status code";
    }

    static requiredMsg(fieldName = null){
        if(fieldName){
            return fieldName + ' is required.';
        }

        return 'There are required fields not informed.;';
    }

    static lengthExceedsMsg(fieldName = null){
        if(fieldName){
            return fieldName + ' exceeds the maximum allowed length.';
        }

        return 'There are fields that exceed the maximum allowed length.';
    }

    static cannotBeCreatedMsg(fieldName = null){
        if(fieldName){
            return `Cannot create ${fieldName}.`;
        }

        return 'Cannot be created.';
    }

    static cannotBeDeletedMsg(fieldName = null){
        if(fieldName){
            return `Cannot delete ${fieldName}.`;
        }

        return 'Cannot be deleted.';
    }

    static cannotBeEditedMsg(fieldName = null){
        if(fieldName){
            return `Cannot edit ${fieldName}.`;
        }

        return 'Cannot be edited.';
    }

    static cannotGetMsg(fieldName = null){
        if(fieldName){
            return `Cannot get ${fieldName}.`;
        }

        return 'Cannot get resource.';
    }

    static alreadyExistsMsg(fieldName = null){
        if(fieldName){
            return `${fieldName} already exists.`;
        }

        return 'Already exists.';
    }
}


module.exports = {
    HTTPResponsePatternModel,
    DEFAULT_PAGE,
    PAGE_SIZE
};
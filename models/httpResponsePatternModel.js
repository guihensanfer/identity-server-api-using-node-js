const { v4: uuidv4 } = require('uuid');
const DEFAULT_PAGE = 1;
const PAGE_SIZE = 15;
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const RolesModel = require('./rolesModel');
const httpReqLog = require('../repositories/httpRequestsLogs');

class HTTPResponsePatternModel{
    constructor(req,res){
        this.message = '';
        this.success = false;
        this.errors = [];
        this.data = [];
        this._statusCode = 0;    
        this.ticket = 'Default';
        this._useLogs = false;
        this.req = req;
        this.res = res;
    }    

    getTicket() {        
        return this.ticket;
    }
    
    getStatusCode(){
        return this._statusCode;
    }

    async useLogs(){
      this.ticket = uuidv4();
      await httpReqLog.init(this.ticket);
      this._useLogs = true;

      return this;
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

    async sendResponse() {
      return new Promise(async (resolve, reject) => {
        try{
          let response = { 
              statusCode: this._statusCode,
              message: this.message,
              ticket: this.ticket,
              success: this.success,
              errors: this.errors,
              data: this.data
          };

          if (this.currentPage) {
              response.currentPage = this.currentPage;
          }

          if (this.totalPages) {
              response.totalPages = this.totalPages;
          }

          if (this._useLogs == true) {
              try {
                  // Update the request log status
                  await httpReqLog.commit(this.ticket, this.req.path, this.req.method, this._statusCode, this.req?.user?.id, this.req.ip);
              } catch (error) {
                  // Handle error
                  console.error("Error updating request log:", error);
              }
          }

          this.res.status(this._statusCode).json(response);
          resolve();
        }
        catch
        {
          // Catch to previne the "Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client"
        }
          
      });
  }
  

    // Return corretly projectId by user role
    // Validation to prevent unauthorized user requests to project IDs outside of their authorization
    static verifyProjectIdOrDefault(req, bodyProjectId){
      if(!req || !req.user || !req.user.projectId)
        return bodyProjectId;

      if(req.user.projectId == -1)
        return bodyProjectId; // Super user can request for any projectId

      return req.user.projectId; // For no super users can't request for any projectId
    }

    static auth(roles) {
        return (req, res, next) => {
          let authHeader = req.headers['authorization'];          

          const fnUnauthorized = function(){            
            let response = new HTTPResponsePatternModel(req,res);

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
      
              const userRoles = Array.isArray(decoded.roles) ? decoded.roles.flat() : [decoded.roles];    
              const hasPermission = roles.some(role => userRoles.includes(role));
      
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

    static authWithAdminGroup(){      
      return HTTPResponsePatternModel.auth(RolesModel.adminGroup);
    }

    static authWithSuperUserGroup(){      
      return HTTPResponsePatternModel.auth(RolesModel.superUserGroup);
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

    static ProcessCodes = Object.freeze({
      /** Generate other accessToken from this
       * Read endpoint: /auth/login
       */
      REFRESH_TOKEN:'REFRESH_TOKEN',

      /** Provider access to basic user infos.
       * Writes endpoints: /auth/login
       * Read endpoint: /oauth/user-info
       */
      OAUTH_USER_INFO:'OAUTH_USER_INFO',

      /** Provider private code with context data (projectid, redirectUrl and etc) to first request from external log in provider
       * Writes endpoints: /login/external/google
       * Read endpoint: /login/external/google/callback
       */
      EXTERNAL_OAUTH_DATA:'EXTERNAL_OAUTH_DATA',

      /**
       * Provider a public code with the all external log in provider context 
       * Writes endpoints: /login/external/google
       * Read endpoint: /login/external/redirect
       */
      EXTERNAL_OAUTH_REDIRECT:'EXTERNAL_OAUTH_REDIRECT',

      /**
       * Provider a private code the send to user email.
       * Writes endpoints: /forget-password
       * Read endpoint: /auth/reset-password
       */
      FORGET_PASSWORD:'FORGET_PASSWORD',

      /**
       * Provider a public code to get a new accesstoken
       * Writes endpoints: /auth/otp
       * Read endpoint: /auth/login
       */
      OTPFor2Step:'OTPFor2Step',

      /**
       * Provider a public code to reset user password
       * Writes endpoints: /oauth/user-info 
       * Read endpoint: /auth/reset-password
       */
      RESET_PASSWORD_FROM_USER_INFO:'RESET_PASSWORD_FROM_USER_INFO'      
    });
}


module.exports = {
    HTTPResponsePatternModel,
    DEFAULT_PAGE,
    PAGE_SIZE
};
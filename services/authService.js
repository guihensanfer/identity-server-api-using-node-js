const httpP = require('../models/httpResponsePatternModel');
const Auth = require('../repositories/authRepository');
const idb = require('../interfaces/idb');
const UsersRoles = require('../repositories/usersRolesRepository');
const Roles = require('../repositories/rolesRepository');

class AuthServices extends idb{
    constructor(ticket){
      super(ticket);
    }

    async createUser(userData, userRoleName) {
        const rolesProcs = new Roles.Procs(this.ticket);
    
        const createdUser = await Auth.data.create({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: null,
          document: null,
          documentTypeId: null,
          projectId: userData.projectId,
          defaultLanguage: userData?.defaultLanguage?.trim(),
          picture: userData?.picture
        },{
            attributes: ['userId']
        });
    
        const userId = createdUser.userId;
    
        if(createdUser){    
          const roleId = await rolesProcs.getRoleIdByName(userRoleName);
    
          const userRole = await UsersRoles.data.create({
              userId: userId,
              roleId: roleId
          });
    
          if(!userRole){
              throw new Error(httpP.HTTPResponsePatternModel.cannotBeCreatedMsg('User Role'));
          }
          
        }
        else
        {
            throw new Error(httpP.HTTPResponsePatternModel.cannotBeCreatedMsg('User'));        
        }
    
        return userId;
    }
}



module.exports = AuthServices;
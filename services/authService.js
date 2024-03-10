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
        // Iniciar uma transação
        const transaction = await Auth.data.sequelize.transaction();
      
        try {
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
          }, {
            attributes: ['userId'],
            transaction // Passando a transação para a operação de criação do usuário
          });
      
          const userId = createdUser.userId;
      
          if (createdUser) {
            const roleId = await rolesProcs.getRoleIdByName(userRoleName, { transaction });
      
            const userRole = await UsersRoles.data.create({
              userId: userId,
              roleId: roleId
            }, {
              transaction // Passando a transação para a operação de criação do papel do usuário
            });
      
            if (!userRole) {
              throw new Error(httpP.HTTPResponsePatternModel.cannotBeCreatedMsg('User Role'));
            }
          } else {
            throw new Error(httpP.HTTPResponsePatternModel.cannotBeCreatedMsg('User'));
          }
      
          // Confirmar a transação
          await transaction.commit();
      
          return userId;
        } catch (error) {
          // Reverter a transação em caso de erro
          await transaction.rollback();
          throw error;
        }
      }
      
}



module.exports = AuthServices;
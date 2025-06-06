const Sequelize = require('sequelize');
const db = require('../db');
const MAX_FIRSTNAME_LENGTH = 100;
const MAX_LASTNAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 200;
const MAX_PASSWORD_LENGTH = 300;
const MAX_GUID_LENGTH = 40;
const MAX_DOCUMENT_LENGTH = 50;
const MAX_LANGUAGE_LENGTH = 50;
const MAX_PICTURE_LENGTH = 200;
const idb = require('../interfaces/idb');
const httpP = require('../models/httpResponsePatternModel');
const UsersRoles = require('../repositories/usersRolesRepository');
const Roles = require('../repositories/rolesRepository');

const data = db._sequealize.define('Users', {
  userId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
  },
  firstName: {
      type: Sequelize.STRING(MAX_FIRSTNAME_LENGTH),
      allowNull: false,
  },
  lastName: {
      type: Sequelize.STRING(MAX_LASTNAME_LENGTH),
  },
  email: {
      type: Sequelize.STRING(MAX_EMAIL_LENGTH),
      allowNull: false,
      unique: 'UQ_EMAIL_PROJECTID', // Adicionando índice único
  },
  password: {
      type: Sequelize.STRING(MAX_PASSWORD_LENGTH),
  },
  guid: {
      type: Sequelize.STRING(MAX_GUID_LENGTH),
      allowNull: false,
      defaultValue: Sequelize.literal('UUID()')
  },
  document: {
      type: Sequelize.STRING(MAX_DOCUMENT_LENGTH),
  },
  documentTypeId: {
      type: Sequelize.INTEGER,
      allowNull: true,
  },
  projectId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
          model: 'Projects', // Referência ao modelo Projects
          key: 'projectId', // Chave referenciada em Projects
      },
      unique: 'UQ_EMAIL_PROJECTID', // Adicionando índice único
  },
  defaultLanguage: {
      type: Sequelize.STRING(MAX_LANGUAGE_LENGTH),
      allowNull: true,
  },
  emailConfirmed:{
    type:Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: 0
  },
  enabled:{
    type:Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: 1
  },
  picture: {
    type: Sequelize.STRING(MAX_PICTURE_LENGTH),
    allowNull: true,
  },
  lastLoginSuccessfullyDate: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  wrongLoginAttemptCount: {
    type: Sequelize.SMALLINT,
    allowNull: true,
  }
}, {
  indexes: [
      {
          fields: ['projectId'],
          name: 'IDX_PROJECTID',
      },
      {
        fields: ['email'],
        name: 'IDX_EMAIL',
      }
  ],
});

// Checkpoint method
async function setUserLoginSuccessfully(userId, method, ticket) {  
  const transaction = await data.sequelize.transaction();
  const operationLog = new db.OperationLogs("USER_LOGIN_SUCCESSFULLY_METHOD", "userId:" + userId.toString() + "|method:" + method, ticket, true);
  let successfully = true; 

  try {    
    await data.update(
      {
        lastLoginSuccessfullyDate: new Date(),
        wrongLoginAttemptCount:0
      },
      {
        where:{
            userId: userId
        }
      },
      transaction
    );

    // Confirmar a transação
    await transaction.commit();    
    
  } catch (error) {
    successfully = false;
    await transaction.rollback();
    throw error;
  }
  finally{
    // create a checkpoint log
    await operationLog.commit(successfully);
  }
}

async function setUserLoginTooManyWrongAttempts(userId, setInvalidUser, currentWrongAttemptsCount, ticket) {  
  const transaction = await data.sequelize.transaction();
  const currentTentative = currentWrongAttemptsCount + 1;
  const operationLog = new db.OperationLogs("USER_LOGIN_WRONG_PASSWORD_ATTEMPTS_METHOD", "userId:" + userId.toString() + "|Current tentative:" + currentTentative.toString() + "|Is turn disabled user:" + setInvalidUser.toString(), ticket, true);
  let successfully = true; 

  try {    
    if(setInvalidUser){
      await data.update(
        {
          emailConfirmed: false
        },
        {
          where:{
            userId: userId
          }
        },
        transaction
      );
    }   
    else
    {
      await data.update(
        {
          wrongLoginAttemptCount: currentTentative
        },
        {
          where:{
            userId: userId
          }
        },
        transaction
      );
    } 

    // Confirmar a transação
    await transaction.commit();    
    
  } catch (error) {
    successfully = false;
    await transaction.rollback();
    throw error;
  }
  finally{
    // create a checkpoint log
    await operationLog.commit(successfully);
  }
}

async function resetPassword(userId, newPasswordHash, ticket, confirmEmailUser = true) {  
  const transaction = await data.sequelize.transaction();
  const operationLog = new db.OperationLogs("RESET_USER_PASSWORD_METHOD", "userId:" + userId.toString(), ticket, true);
  let successfully = true; 

  try {    
    await data.update({
      password: newPasswordHash
    }, {
        where: {
            userId:userId
    }},
    transaction);

    if(confirmEmailUser){
      await data.update({
        emailConfirmed: true
      }, {
          where: {
              userId:userId
      }},
      transaction);
    }

    // Confirmar a transação
    await transaction.commit();    
    
  } catch (error) {
    successfully = false;
    await transaction.rollback();
    throw error;
  }
  finally{
    // create a checkpoint log
    await operationLog.commit(successfully);
  }
}

// Checkpoint method
async function createUser(userData, userRoleName, ticket) {  
  const transaction = await data.sequelize.transaction();
  const operationLog = new db.OperationLogs("CREATE_USER_METHOD", null, ticket, true);
  let successfully = true; 

  try {
    const rolesProcs = new Roles.Procs(ticket);

    const createdUser = await data.create({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData?.password,
      document: userData?.document,
      documentTypeId: userData?.documentTypeId,
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
    successfully = false;
    await transaction.rollback();
    throw error;
  }
  finally{
    // create a checkpoint log
    await operationLog.commit(successfully);
  }
}

async function updateUser(userId, userData, ticket) {  
  const transaction = await data.sequelize.transaction();
  const operationLog = new db.OperationLogs("UPDATE_USER_METHOD", null, ticket, true);
  let successfully = true; 

  try {    

    await data.update(
      userData, 
      {
        where:{
          userId: userId
        }
      },
      transaction
    );

    await transaction.commit();    

    return userId;
  } catch (error) {
    successfully = false;
    await transaction.rollback();
    throw error;
  }
  finally{
    // create a checkpoint log
    await operationLog.commit(successfully);
  }
}


class Procs extends idb{
  constructor(ticket){
    super(ticket);
  }

  async checkUserExists(email = null, projectId = null, enabled = null) {
    try {
      const res = await db.executeProcedure('USP_USERS_SELECT_EXISTS', [email, projectId, enabled], this.ticket);
      return res[0][0][0].result > 0;
    } catch {
      return false;
    }
  }

  async userTokenCreate(userId, expiredAt, requestIp = null, processName = 'Default', data = null) {
    try {
      const res = await db.executeProcedure('USP_UserToken_Insert', [userId, requestIp, expiredAt, processName, data], this.ticket);
      return res[0][0][0].result;
    } catch {
      return null;
    }
  }  

  async userTokenVerify(token, requestIp = null, processName = null) {
    try {
      const res = await db.executeProcedure('USP_UserToken_Check', [token, requestIp, processName], this.ticket);
      return res[0][0][0].userId;
    } catch {
      return null;
    }
  }

  async userTokenVerifyAll(token, requestIp = null, processName = null) {
    try {
      const res = await db.executeProcedure('USP_UserToken_Check', [token, requestIp, processName], this.ticket);
      return res[0][0][0];
    } catch {
      return null;
    }
  }
}


module.exports = {
  resetPassword,
  createUser,
  setUserLoginTooManyWrongAttempts,
  setUserLoginSuccessfully,
  updateUser,
  data,
  Procs,
  MAX_FIRSTNAME_LENGTH,
  MAX_LASTNAME_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
  MAX_GUID_LENGTH,
  MAX_DOCUMENT_LENGTH,
  MAX_LANGUAGE_LENGTH ,
  MAX_PICTURE_LENGTH
}
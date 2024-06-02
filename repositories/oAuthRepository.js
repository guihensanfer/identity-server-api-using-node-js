const Sequelize = require('sequelize');
const db = require('../db');
const idb = require('../interfaces/idb');
const MAX_CALLBACKURI_LENGTH = 300;
const MAX_SECRET_LENGTH = 100;
const { v4: uuidv4 } = require('uuid');

const data = db._sequealize.define('UsersOAuths', {
    usersOAuthId:{
        type: Sequelize.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true,        
    },
    userId:{
        type: Sequelize.INTEGER,
        allowNull:false,
        references: {
            model: 'Users', 
            key: 'userId'
        }        
    },
    clientCallbackUri:{
        type: Sequelize.STRING(MAX_CALLBACKURI_LENGTH),
        allowNull:false
    },
    clientSecret:{
        type: Sequelize.STRING(MAX_SECRET_LENGTH),
        allowNull:false
    },
    enabled:{
        type: Sequelize.BOOLEAN,
        allowNull:false,
        defaultValue: 1
    }
});


// Checkpoint method
async function createUserCallback(userId, callbackUri, ticket) {  
    const transaction = await data.sequelize.transaction();
    const operationLog = new db.OperationLogs("CREATE_USER_CALLBACK_METHOD", null, ticket, true);
    let successfully = true; 
  
    try {      
  
        await data.destroy({
                where:{
                    userId: userId
                }
            },
            {
                transaction      
            });

        const createdData = await data.create({
            clientCallbackUri: callbackUri,
            enabled: true,
            userId: userId,
            clientSecret: uuidv4()      // always after changed set new secret  
        }, {        
            attributes: ['UsersOAuthId'],
            transaction
        });
    
        const dataId = createdData.usersOAuthId;
    
        if (dataId) {
            // success

        } else {
            throw new Error(httpP.HTTPResponsePatternModel.cannotBeCreatedMsg('User Callback'));
        }
    
        // Confirmar a transação
        await transaction.commit();    
    
        return dataId;

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
    
    async getCallbackContext(userId, projectId) {
        try {
          const res = await db.executeProcedure('USP_OAUTH_CONTEXT_SELECT', [userId, projectId], this.ticket);
          return res[0][0][0];
        } catch {
          return false;
        }
      }
}

module.exports = {
    data,
    createUserCallback,
    MAX_CALLBACKURI_LENGTH,
    Procs
};
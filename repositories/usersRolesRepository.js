const Sequelize = require('sequelize');
const db = require('../db');
const idb = require('../interfaces/idb');
const RolesRepository = require('../repositories/rolesRepository');

const data = db._sequealize.define('UsersRoles', {
    usersRolesId:{
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
    roleId:{
        type: Sequelize.INTEGER,
        allowNull:false,
        references: {
            model: 'Roles', 
            key: 'roleId'
        }
    }
});

// Checkpoint method
async function setUserNewRole(userId, roleName, ticket) {  
    const transaction = await data.sequelize.transaction();
    const operationLog = new db.OperationLogs("SET_USER_NEW_ROLE_METHOD", null, ticket, true);
    let successfully = true; 
  
    try {      

        const rolesProcs = new RolesRepository.Procs(ticket);

        let newRoleId = 0;

        newRoleId = await rolesProcs.getRoleIdByName(roleName);

        if(!newRoleId || newRoleId <= 0){
            throw new Error(httpP.HTTPResponsePatternModel.cannotGetMsg('User new role Id'));
        }
  
        await data.delete({
                where:{
                    userId: userId
                }
            },
            {
                transaction      
            });

        const createdData = await data.create({
            userId: userId,
            roleId: newRoleId,        
        }, {        
            attributes: ['usersRolesId'],
            transaction
        });
    
        const dataId = createdData.usersRolesId;
    
        if (dataId) {
            // success

        } else {
            throw new Error(httpP.HTTPResponsePatternModel.cannotBeCreatedMsg('User new role'));
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
    
}

module.exports = {
    data,
    Procs,
    setUserNewRole
};
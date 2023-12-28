const Sequelize = require('sequelize');
const db = require('../db');

const data = db._sequealize.define('Roles', {
    roleId:{
        type: Sequelize.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true     
    },
    name:{
        type: Sequelize.STRING(20),
        allowNull:false        
    },
    description:{
        type: Sequelize.STRING(100),
        allowNull:true        
    }
});

async function getRoleIdByName(roleName){
    try
    {
        let res = await db.executeProcedure('USP_Roles_GET_BY_NAME', [roleName]);

        let value = res[0][0][0].roleId;

        if(value){
            return parseInt(value);
        }

        return 0
    }
    catch{
        return 0;
    }
}

module.exports = {
    data,
    getRoleIdByName
};
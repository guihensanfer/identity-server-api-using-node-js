const Sequelize = require('sequelize');
const db = require('../db');
const idb = require('../interfaces/idb');

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


class Procs extends idb{
    constructor(ticket){
        super(ticket);
    }

    async getRoleIdByName(roleName){
        try
        {
            let res = await db.executeProcedure('USP_Roles_GET_BY_NAME', [roleName], this.ticket);
    
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
    
    async getRoleArrayNamesByIds(roleIds){
        try
        {
            let values = roleIds.join(',');
    
            let res = await db.executeProcedure('USP_Roles_GET_BY_ID', [values], this.ticket);
    
            if(!res){
                return null;
            }
           
            return res[0][0].map(res => res.name);
        }
        catch(err){
            throw err; 
        }
    }
}

module.exports = {
    data,
    Procs
};
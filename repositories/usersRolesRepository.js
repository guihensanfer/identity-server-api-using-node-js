const Sequelize = require('sequelize');
const db = require('../db');
const idb = require('../interfaces/idb');

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

class Procs extends idb{
    constructor(ticket){
        super(ticket);
    }
    
}

module.exports = {
    data,
    Procs
};
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

module.exports = data;
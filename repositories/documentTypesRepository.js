const Sequelize = require('sequelize');
const db = require('../db');

const data = db._sequealize.define('DocumentTypes', {
    DocumentTypeId:{
        type: Sequelize.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true,        
    },
    Name:{
        type: Sequelize.STRING(20),
        allowNull:false        
    },
    Description:{
        type: Sequelize.STRING(100),
        allowNull:false        
    }
});

module.exports = data;
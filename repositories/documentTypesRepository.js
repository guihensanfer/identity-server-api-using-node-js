const Sequelize = require('sequelize');
const db = require('../db');
const idb = require('../interfaces/idb');

const data = db._sequealize.define('DocumentTypes', {
    documentTypeId:{
        type: Sequelize.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true,        
    },
    name:{
        type: Sequelize.STRING(20),
        allowNull:false        
    },
    description:{
        type: Sequelize.STRING(100),
        allowNull:false        
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
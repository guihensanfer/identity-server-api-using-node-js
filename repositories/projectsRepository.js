const Sequelize = require('sequelize');
const db = require('../db');
const idb = require('../interfaces/idb');
const MAX_ENCRYPTION_KEY_LENGTH = 100;

const data = db._sequealize.define('Projects', {
    projectId:{
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
    },
    picture:{
        type: Sequelize.STRING(200),
        allowNull:true        
    },
    passwordStrengthRegex:{
        type: Sequelize.STRING(200),
        allowNull:true        
    },
    encryptionAESKey:{
      type:Sequelize.STRING(MAX_ENCRYPTION_KEY_LENGTH),
      allowNull:true
    },
    encryptionAESIV:{
      type:Sequelize.STRING(MAX_ENCRYPTION_KEY_LENGTH),
      allowNull:true
    }
});

async function getProjectAESEncryptCredentials(projectId){
    return {encryptionAESKey, encryptionAESIV} = await data.findOne({
        where:{
            projectId: projectId
        },
        attributes: ['encryptionAESKey', 'encryptionAESIV']
    });
}

class Procs extends idb{
    constructor(ticket){
        super(ticket);
    }
    
}

module.exports = {
    data,
    getProjectAESEncryptCredentials,
    Procs
};
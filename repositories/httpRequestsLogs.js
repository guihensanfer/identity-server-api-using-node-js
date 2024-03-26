const Sequelize = require('sequelize');
const db = require('../db');
const ErrorLogModel = require('../models/errorLogModel');
const MAX_TICKET_LENGTH = 40;
const MAX_REQUEST_PATH_LENGTH = 40;
const MAX_REQUEST_IP_LENGTH = 50;
const MAX_REQUEST_METHOD_LENGTH = 15;

const data = db._sequealize.define('HttpRequestsLogs', {
    ticket:{
        type: Sequelize.STRING(MAX_TICKET_LENGTH),
        allowNull:false,
        primaryKey:true        
    },
    requestEndDate:{
        type: Sequelize.DATE,
        allowNull:true        
    },
    requestPath:{
        type: Sequelize.STRING(MAX_REQUEST_PATH_LENGTH),
        allowNull:false        
    },
    requestIp:{
        type: Sequelize.STRING(MAX_REQUEST_IP_LENGTH),
        allowNull:true        
    },
    requestMethod:{
        type: Sequelize.STRING(MAX_REQUEST_METHOD_LENGTH),
        allowNull:true        
    },
    ownerUserId:{
        type: Sequelize.INTEGER,
        allowNull:true,        
        references: {
            model: 'Users', 
            key: 'userId'
        }        
    },
    requestCompletionStatus:{
        type: Sequelize.SMALLINT,
        allowNull:true    
    }
});

async function init(ticket){
    try{
        await data.findCreateFind({
            where: {
                ticket: ticket
            },
            defaults:{
                ticket: ticket,                
                requestPath: 'Initial'
            }
        });
    }
    catch(error){
        const errorLog = ErrorLogModel.DefaultForSequelize('httpRequestsLogs.init', error, ticket);

        await db.errorLogInsert(errorLog);
    }
}

async function commit(ticket, requestPath, requestMethod, statusCode, ownerUserId = null, requestIp = null){
    try {
        await data.update(
            {                
                requestEndDate: new Date(),
                requestPath: requestPath,
                requestIp: requestIp,
                ownerUserId: ownerUserId,
                requestCompletionStatus: statusCode,
                requestMethod: requestMethod
            },
            {
                where:{
                    ticket: ticket
                }
            }  
        );          
    }
    catch (error){
        const errorLog = ErrorLogModel.DefaultForSequelize('httpRequestsLogs.commit', error, ticket);

        await db.errorLogInsert(errorLog);
    }    
}

module.exports = {
    init,
    commit,
    data
};
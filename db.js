const mysql = require('mysql2');
const ErrorLogModel = require('./models/errorLogModel');
const util = require('./services/utilService');
const thread = require('./services/threadService');
const Sequelize = require('sequelize');
const _sequealize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  dialect:'mysql',
  host:process.env.DB_HOST,
  port:3306
});
const ERRORLOGS_PROCEDURE_NAME = 'USP_ERRORLOGS_INSERT';
const STATISTICS_PROCEDURE_NAME = 'USP_OperationLogs_Insert';
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
});

class OperationLogs{
  constructor(procedureName, sqlCall, ticket, is_checkpoint){
      this.ticket = ticket;
      this.procedureName = procedureName;        
      this.startTime = performance.now();
      this.timeElapsed = null;
      this.successfully = false;
      this.sqlCall = sqlCall;
      this.ticket = ticket;
      
      this.is_checkpoint = is_checkpoint;
  }

  async commit(successfully){    
    let finish = performance.now();
    this.timeElapsed = finish - this.startTime;
    
    finish = null;

    this.successfully = successfully;

    await operationLogsInsert(this.ticket, 
      this.procedureName, 
      this.timeElapsed,
      this.sqlCall,
      this.successfully,
      this.is_checkpoint);
  }
}

async function operationLogsInsert (ticket,
  procedureName,
  timeElapsed,
  sqlCall,
  successfully,
  is_checkpoint){      
  
  await executeProcedure(STATISTICS_PROCEDURE_NAME, [
    procedureName, 
    timeElapsed, 
    sqlCall,
    ticket,
    successfully,
    is_checkpoint
  ]);
}


async function errorLogInsert (errorLogModel){
  let procedureName = ERRORLOGS_PROCEDURE_NAME;
  const {
      errorMessage,
      errorCode,
      errorSeverity,
      errorSource,
      errorDetails,
      userID,
      ipAddress,
      ticket
  } = errorLogModel;
  
  await executeProcedure(procedureName, [
      errorMessage,
      errorCode,
      errorSeverity,
      errorSource,
      errorDetails,
      userID,
      ipAddress,
      ticket
  ]);
}

async function executeProcedure(procedureName, params = [], ticket = 'Default', isLogCheckpoint = false){    
  const placeholders = params?.map(() => '?').join(',');
  const callProcedure = `CALL ${procedureName}(${placeholders})`;  
  let successfully = true; 
  const formattedParams = params?.map(param => {
    let paramType = util.getParameterType(param);
      
    if (paramType === 'int') {
      return parseInt(param, 10);
    } else if (paramType === 'double') {
      return parseFloat(param);
    } else if (paramType === 'varchar') {
      return param;
    } else if (paramType === 'datetime') {
      return util.formatDatetime(param);
    } else if (paramType === 'boolean') {
      return param ? 1 : 0; // Convertendo para 0 ou 1
    } else if (paramType === 'json') {
      return util.formatJSON(param);
    }      

    return param; 
  });   
  const operationLog = new OperationLogs(procedureName,
    `CALL ${procedureName}(${formattedParams?.join(',')})`,
    ticket,
    isLogCheckpoint);

  try {                   
    const results = await pool.promise().query(callProcedure, formattedParams);
    
    return results;

  } catch (error) { 
    const errorLog = new ErrorLogModel(
      error.message,
      error.errno ?? 0,
      3,
      'SQL Message: ' + error.sqlmessage + '|SQL: ' + error.sql + '|Stack: ' + error.stack,
      null,
      null,
      null,
      ticket
    );    

    await errorLogInsert(errorLog);

    successfully = false;

    throw error;
  }
  finally{
    // operation logs
    if(procedureName != ERRORLOGS_PROCEDURE_NAME && procedureName != STATISTICS_PROCEDURE_NAME){
      await operationLog.commit(successfully);              
    }
  }
}

module.exports = {
  OperationLogs,
    pool,    
    errorLogInsert,
    executeProcedure,
    operationLogsInsert,
    _sequealize
};
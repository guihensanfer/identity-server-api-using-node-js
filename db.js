const mysql = require('mysql2');
const ErrorLogModel = require('./models/errorLogModel');
const util = require('./services/utilService');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
});

async function errorLogInsert (errorLogModel){
  let procedureName = 'USP_ERRORLOG_INSERT';
  const {
      errorMessage,
      errorCode,
      errorSeverity,
      errorSource,
      errorDetails,
      userID,
      ipAddress,
  } = errorLogModel;
  
  await executeProcedure(procedureName, [
      errorMessage,
      errorCode,
      errorSeverity,
      errorSource,
      errorDetails,
      userID,
      ipAddress
  ]);
}

async function executeProcedure(procedureName, params = []){
  try {
    const placeholders = params.map(() => '?').join(',');
    const callProcedure = `CALL ${procedureName}(${placeholders})`;    
    const formattedParams = params.map(param => {
      const paramType = util.getParameterType(param);

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
      // Adicione mais validações para outros tipos conforme necessário

      return param; // Se não corresponder a nenhum tipo, mantém o valor
    });       
    
    const results = await pool.promise().query(callProcedure, formattedParams);
    
    return results;

  } catch (error) { 
    let errorLog = new ErrorLogModel(
      error.message,
      0,
      3,
      error.stack,
      null,
      null,
      null
    );    

    await errorLogInsert(errorLog);

    throw error;
  }
}

module.exports = {
    
    pool,    
    errorLogInsert,

    executeProcedure
};
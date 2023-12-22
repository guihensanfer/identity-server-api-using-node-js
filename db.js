const mysql = require('mysql2');
const ErrorLogModel = require('./models/errorLogModel');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
});

function getParameterType(value) {
    if (typeof value === 'number' && Number.isInteger(value)) {
      return 'int';
    } else if (typeof value === 'number') {
      return 'double';
    } else if (typeof value === 'string') {
      return 'varchar';
    } else if (value instanceof Date) {
      return 'datetime';
    } else if (typeof value === 'boolean') {
      return 'boolean';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return 'json';
    }
   
    return 'default';
}
  
function formatDatetime(value) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 19).replace('T', ' '); // Formato: 'YYYY-MM-DD HH:MM:SS'
    }
    return null;
}
  
function formatJSON(value) {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return null;
    }
}

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
      const paramType = getParameterType(param);

      if (paramType === 'int') {
        return parseInt(param, 10);
      } else if (paramType === 'double') {
        return parseFloat(param);
      } else if (paramType === 'varchar') {
        return mysql.escape(param);
      } else if (paramType === 'datetime') {
        return formatDatetime(param);
      } else if (paramType === 'boolean') {
        return param ? 1 : 0; // Convertendo para 0 ou 1
      } else if (paramType === 'json') {
        return formatJSON(param);
      }
      // Adicione mais validações para outros tipos conforme necessário

      return param; // Se não corresponder a nenhum tipo, mantém o valor
    });
    console.log(formattedParams);
    if(procedureName == 'USP_TEST2'){
      throw new error('test');
    }
    

    const results = await pool.promise().query(callProcedure, formattedParams);
    

    return results;
  } catch (error) {
    if(procedureName == 'USP_TEST2'){
      const errorMessage = error.message; // Extracting the error message
    const errorCode = 0; // Extracting error code (if available)
    const errorSeverity =2; // Assuming a default severity for the example
    const errorSource = 'Some source'; // Assuming a default error source
    const errorDetails = JSON.stringify({
      result:'success',

    }); // Storing the whole error object as details (you can customize this)
    const userID = null; // Assuming a default user ID
    const ipAddress = null; 

    let errorLog = new ErrorLogModel(
      errorMessage,
      errorCode,
      errorSeverity,
      errorSource,
      errorDetails,
      userID,
      ipAddress
    );

    console.log(errorLog);

    await errorLogInsert(errorLog);

    
    }
    throw error;
  }
}

module.exports = {
    
    pool,    
    errorLogInsert,

    executeProcedure
};
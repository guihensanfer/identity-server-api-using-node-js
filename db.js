const mysql = require('mysql2');

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
    // Adicione mais verificações de tipo conforme necessário (ex: outros tipos de dados)
  
    // Se nenhum tipo corresponder, retorna 'default'
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
// pool.connect((err) => {
//     if (err) {
//         console.error('Error connecting to database:', err);
//         return;
//     }
//     console.log('Connected to database');
// });

module.exports = {
    
    pool,

    // Example
    // const procedureName = 'USP_GET_USER_BY_ID';
    // const params = [{ value: userId, type: 'int' }];
    // const results = await database.executeProcedure(procedureName, params);
    // executeProcedure: async (procedureName, params = []) => {
    //     try {
    //       const placeholders = params.map(() => '?').join(',');
    //       const callProcedure = `CALL ${procedureName}(${placeholders})`;
    
    //       const formattedParams = params.map(param => {
    //         if (param.type === 'int') {
    //           return parseInt(param.value, 10); // Converte para inteiro se for 'int'
    //         } else if (param.type === 'varchar') {
    //           // Valida e escapa a string para evitar caracteres especiais
    //           return mysql.escape(param.value);
    //         } else {
    //           return param.value; // Mantém como está para outros tipos
    //         }
    //       });
    
    //       const results = await query(callProcedure, formattedParams);
    //       return results;
    //     } catch (error) {            
    //       throw error;
    //     }
    //   }

    executeProcedure: async (procedureName, params = []) => {
        try {
          const placeholders = params.map(() => '?').join(',');
          const callProcedure = `CALL ${procedureName}(${placeholders})`;
    console.log(callProcedure);
          const formattedParams = params.map(param => {
            const paramType = getParameterType(param.value);
    console.log(paramType);
            if (paramType === 'int') {
              return parseInt(param.value, 10);
            } else if (paramType === 'double') {
              return parseFloat(param.value);
            } else if (paramType === 'varchar') {
              return mysql.escape(param.value);
            } else if (paramType === 'datetime') {
              return formatDatetime(param.value);
            } else if (paramType === 'boolean') {
              return param.value ? 1 : 0; // Convertendo para 0 ou 1
            } else if (paramType === 'json') {
              return formatJSON(param.value);
            }
            // Adicione mais validações para outros tipos conforme necessário
    
            return param.value; // Se não corresponder a nenhum tipo, mantém o valor
          });

          console.log('-> ' + callProcedure);
          console.log('->' + formattedParams);

          const results = await pool.promise().query(callProcedure, formattedParams);
          return results;
        } catch (error) {
          throw error;
        }
    }
};
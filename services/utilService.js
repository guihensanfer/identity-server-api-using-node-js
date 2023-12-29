const jwt = require('jsonwebtoken');
const _ = require('lodash');
const DEFAULT_PAGE = 1;
const PAGE_SIZE = 10;

function extractNumbers(value) {  
  const numbersOnly = value.replace(/\D/g, '');

  return numbersOnly; // Return only the numbers
}

function auth(roles) {
  return (req, res, next) => {
    let authHeader = req.headers['authorization'];

    if (_.isNull(authHeader) || _.isEmpty(authHeader)) {
      return sendResponse(res, false, 401, 'Unauthorized', null, ['Unauthorized']);
    }

    let token = authHeader.split(' ')[1];

    if (!token) {
      return sendResponse(res, false, 401, 'Unauthorized', null, ['Unauthorized']);
    }

    try {
      let secret = process.env.SECRET;

      jwt.verify(token, secret, (err, decoded) => {
        if (err || !decoded.roles || decoded.roles.length === 0) {
          return sendResponse(res, false, 403, 'Forbidden', null, ['Forbidden']);
        }

        let userRoles = Array.isArray(decoded.roles) ? decoded.roles.flat() : [decoded.roles];

        let hasPermission = roles.some(role => userRoles.includes(role));

        if (!hasPermission) {
          return sendResponse(res, false, 403, 'Forbidden', null, ['Forbidden']);
        }
        
        req.user = decoded;
        next();
      });
    } catch {
      return sendResponse(res, false, 403, 'Forbidden', null, ['Forbidden']);
    }
  };
}


async function sendResponse(res,success, status, message, data = null, errors = null, currentPage = null, totalPages = null) {
  return new Promise((resolve, reject) => {
      const response = { message };
      response.success = success;
      response.errors = errors; 
      response.data = data; 

      if(currentPage){
        response.currentPage = currentPage;
      }

      if(totalPages){
        response.totalPages = totalPages;
      }
                  
      res.status(status).json(response);
      resolve();
  });
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function formatDatetime(value) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 19).replace('T', ' '); // Formato: 'YYYY-MM-DD HH:MM:SS'
    }
    return null;
}

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
  
function formatJSON(value) {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return null;
    }
}

module.exports = {
    formatDatetime,
    getParameterType,
    formatJSON,
    isValidEmail,
    sendResponse,
    checkToken: auth,
    extractNumbers,
    DEFAULT_PAGE,
    PAGE_SIZE
}
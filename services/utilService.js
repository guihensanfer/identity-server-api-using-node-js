const _ = require('lodash');
const url = require('url');

function isValidURI(uri) {
  try {
    new URL(uri);
    return true;
  } catch (error) {
    return false;
  }
}

function extractNumbers(value) {  
  const numbersOnly = value.replace(/\D/g, '');

  return numbersOnly; // Return only the numbers
}

function hexStringToBytes(hex) {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return Buffer.from(bytes);
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
  
function convertToJSON(value) {
  try {
    const jsonObject = JSON.parse(value);
    return jsonObject;
  } catch (error) {      
      return null;
  }
}

module.exports = {
    formatDatetime,
    getParameterType,
    convertToJSON,
    formatJSON,
    isValidEmail,
    extractNumbers,
    isValidURI,
    hexStringToBytes
}
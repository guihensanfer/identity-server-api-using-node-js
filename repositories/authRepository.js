const { query } = require("express");
const { executeProcedure } = require("../db");

const checkUserExists = async (email) => {  
  const results = await executeProcedure('USP_USERS_SELECT_EXISTS', [{
    value: email, 
    type: 'varchar'
  }]);

  return results;
};

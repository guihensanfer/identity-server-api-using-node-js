const { executeProcedure } = require("../db");
const util = require('../services/utilService');

const checkUserExists = async (email = null) => {  
  if(!util.isValidEmail(email)){
    return false;
  }

  const results = await executeProcedure('USP_USERS_SELECT_EXISTS', [{email}])
  .then(res => {

    return res[0][0][0].result > 0;

  });

  return results;
};

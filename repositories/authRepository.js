const checkUserExists = async (email) => {
    try {
      const procedureName = 'USP_USERS_SELECT_EXISTS';
      const results = await query(`CALL ${procedureName}('${email}')`);

      return results;
    } catch (error) {
      throw error;
    }
};
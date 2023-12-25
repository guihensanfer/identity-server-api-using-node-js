const Sequelize = require('sequelize');
const db = require('../db');

const Users = db._sequealize.define('Users', {
  UserId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
  },
  FirstName: {
      type: Sequelize.STRING(100),
      allowNull: false,
  },
  LastName: {
      type: Sequelize.STRING(100),
  },
  Email: {
      type: Sequelize.STRING(200),
      allowNull: false,
      unique: 'UQ_EMAIL_PROJECTID', // Adicionando índice único
  },
  Password: {
      type: Sequelize.STRING(300),
  },
  DateEntered: {
      type: Sequelize.DATEONLY,
      allowNull: false,
  },
  Guid: {
      type: Sequelize.STRING(200),
      allowNull: false,
  },
  Document: {
      type: Sequelize.STRING(50),
  },
  DocumentTypeId: {
      type: Sequelize.INTEGER,
      allowNull: false,
  },
  ProjectId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
          model: 'Projects', // Referência ao modelo Projects
          key: 'ProjectId', // Chave referenciada em Projects
      },
      unique: 'UQ_EMAIL_PROJECTID', // Adicionando índice único
  },
  DefaultLanguage: {
      type: Sequelize.STRING(50),
  },
}, {
  indexes: [
      {
          fields: ['ProjectId'],
          name: 'IDX_PROJECTID',
      },
      {
        fields: ['Email'],
        name: 'IDX_EMAIL',
      }
  ],
});

const checkUserExists = async (email = null) => {  
  if(!util.isValidEmail(email)){
    return false;
  }

  await db.executeProcedure('USP_USERS_SELECT_EXISTS', [{email}])
  .then(res => {

    return res[0][0][0].result > 0;

  });

  return false;
};

module.exports = {
  Users,
  checkUserExists
}
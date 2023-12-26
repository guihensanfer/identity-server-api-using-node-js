const Sequelize = require('sequelize');
const db = require('../db');
const MAX_FIRSTNAME_LENGTH = 100;
const MAX_LASTNAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 200;
const MAX_PASSWORD_LENGTH = 300;
const MAX_GUID_LENGTH = 40;
const MAX_DOCUMENT_LENGTH = 50;
const MAX_LANGUAGE_LENGTH = 50;

const data = db._sequealize.define('Users', {
  UserId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
  },
  FirstName: {
      type: Sequelize.STRING(MAX_FIRSTNAME_LENGTH),
      allowNull: false,
  },
  LastName: {
      type: Sequelize.STRING(MAX_LASTNAME_LENGTH),
  },
  Email: {
      type: Sequelize.STRING(MAX_EMAIL_LENGTH),
      allowNull: false,
      unique: 'UQ_EMAIL_PROJECTID', // Adicionando índice único
  },
  Password: {
      type: Sequelize.STRING(MAX_PASSWORD_LENGTH),
  },
  Guid: {
      type: Sequelize.STRING(MAX_GUID_LENGTH),
      allowNull: false,
      defaultValue: Sequelize.literal('UUID()')
  },
  Document: {
      type: Sequelize.STRING(MAX_DOCUMENT_LENGTH),
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
      type: Sequelize.STRING(MAX_LANGUAGE_LENGTH),
      allowNull: true,
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

const checkUserExists = async (email = null, projectId = null) => {    
  try
  {
    let res = await db.executeProcedure('USP_USERS_SELECT_EXISTS', [email, projectId]);

    return res[0][0][0].result > 0;
  }
  catch{
    return false;
  }
};

module.exports = {
  data,
  checkUserExists,
  MAX_FIRSTNAME_LENGTH,
  MAX_LASTNAME_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
  MAX_GUID_LENGTH,
  MAX_DOCUMENT_LENGTH,
  MAX_LANGUAGE_LENGTH 
}
const Sequelize = require('sequelize');
const db = require('../db');
const MAX_FIRSTNAME_LENGTH = 100;
const MAX_LASTNAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 200;
const MAX_PASSWORD_LENGTH = 300;
const MAX_GUID_LENGTH = 40;
const MAX_DOCUMENT_LENGTH = 50;
const MAX_LANGUAGE_LENGTH = 50;
const idb = require('../interfaces/idb');

const data = db._sequealize.define('Users', {
  userId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
  },
  firstName: {
      type: Sequelize.STRING(MAX_FIRSTNAME_LENGTH),
      allowNull: false,
  },
  lastName: {
      type: Sequelize.STRING(MAX_LASTNAME_LENGTH),
  },
  email: {
      type: Sequelize.STRING(MAX_EMAIL_LENGTH),
      allowNull: false,
      unique: 'UQ_EMAIL_PROJECTID', // Adicionando índice único
  },
  password: {
      type: Sequelize.STRING(MAX_PASSWORD_LENGTH),
  },
  guid: {
      type: Sequelize.STRING(MAX_GUID_LENGTH),
      allowNull: false,
      defaultValue: Sequelize.literal('UUID()')
  },
  document: {
      type: Sequelize.STRING(MAX_DOCUMENT_LENGTH),
  },
  documentTypeId: {
      type: Sequelize.INTEGER,
      allowNull: true,
  },
  projectId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
          model: 'Projects', // Referência ao modelo Projects
          key: 'projectId', // Chave referenciada em Projects
      },
      unique: 'UQ_EMAIL_PROJECTID', // Adicionando índice único
  },
  defaultLanguage: {
      type: Sequelize.STRING(MAX_LANGUAGE_LENGTH),
      allowNull: true,
  },
  emailConfirmed:{
    type:Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: 0
  }
}, {
  indexes: [
      {
          fields: ['projectId'],
          name: 'IDX_PROJECTID',
      },
      {
        fields: ['email'],
        name: 'IDX_EMAIL',
      }
  ],
});

class Procs extends idb{
  constructor(ticket){
    super(ticket);
  }

  async checkUserExists(email = null, projectId = null) {
    try {
      const res = await db.executeProcedure('USP_USERS_SELECT_EXISTS', [email, projectId], this.ticket);
      return res[0][0][0].result > 0;
    } catch {
      return false;
    }
  }

  async userTokenCreate(userId, expiredAt, requestIp = null, processName = 'Default') {
    try {
      const res = await db.executeProcedure('USP_UserToken_Insert', [userId, requestIp, expiredAt, processName], this.ticket);
      return res[0][0][0].result;
    } catch {
      return null;
    }
  }

  async userTokenVerify(token, requestIp = null) {
    try {
      const res = await db.executeProcedure('USP_UserToken_Check', [token, requestIp], this.ticket);
      return res[0][0][0].result;
    } catch {
      return null;
    }
  }
}


module.exports = {
  data,
  Procs,
  MAX_FIRSTNAME_LENGTH,
  MAX_LASTNAME_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
  MAX_GUID_LENGTH,
  MAX_DOCUMENT_LENGTH,
  MAX_LANGUAGE_LENGTH 
}
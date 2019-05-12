'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const db = {};
const config = require('../config1.json');


const {
    dataPath
} = config;

console.log("Attempting to connect to database");
// Connect to database.
const sequelize = new Sequelize({
    operatorsAliases: false,
    dialect: 'sqlite',
    storage: path.join(dataPath, 'db.sqlite'),
    define: {
        timestamps: false
    },
    options:
  {
      retry: {
          match: [
              /SQLITE_BUSY/
          ],
          name: 'query',
          max: 5
      }
  }
});

fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        const model = sequelize['import'](path.join(__dirname, file));
        db[model.name] = model;
    });

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

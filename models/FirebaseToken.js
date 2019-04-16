'use strict';

module.exports = (sequelize, Sequelize) => {
    var FirebaseToken = sequelize.define(
        'FirebaseToken',
        {
            id:
            {
                type: Sequelize.STRING,
                allowNull: false,
                primaryKey: true
            },
            token:
            {
                type: Sequelize.STRING,
                allowNull: true
            }
        }
    );
    return FirebaseToken;
};
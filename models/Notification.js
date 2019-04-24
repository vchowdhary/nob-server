'use strict';

module.exports = (sequelize, Sequelize) => {
    var Notification = sequelize.define(
        'Notification',
        {
            to:
            {
                type: Sequelize.STRING,
                allowNull: false,
            },
            from:
            {
                type: Sequelize.STRING,
                allowNull: true
            },
            message:
            {
                type: Sequelize.STRING,
                allowNull: true
            },
            status: 
            {
                type: Sequelize.STRING,
                allowNull: true
            }
        }
    );
    return Notification;
};
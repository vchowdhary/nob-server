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
            title:
            {
                type: Sequelize.STRING,
                allowNull: true
            },
            status: 
            {
                type: Sequelize.STRING,
                allowNull: true
            },
            prev:
            {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            next:
            {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            attempts:
            {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            matchID:
            {
                type: Sequelize.INTEGER,
                allowNull: true
            }
        }
    );
    return Notification;
};
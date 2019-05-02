'use strict';

module.exports = (sequelize, Sequelize) => {
    var NotificationList = sequelize.define(
        'NotificationList',
        {
            first:
            {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            last:
            {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            attempts:
            {
                type: Sequelize.INTEGER,
                allowNull: true
            }
        }
    );
    return NotificationList;
};
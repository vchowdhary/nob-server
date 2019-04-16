
'use strict';

module.exports = (sequelize, Sequelize) => {
    var DeliveryCategories = sequelize.define(
        'DeliveryCategory',
        {
            category:
            {
                type: Sequelize.STRING,
                allowNull: false,
                primaryKey: true
            }
        }
    );
    return DeliveryCategories;
};
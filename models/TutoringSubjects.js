
'use strict';

module.exports = (sequelize, Sequelize) => {
    var TutoringSubjects = sequelize.define(
        'TutoringSubject',
        /**@lends module:Location */{
            subject:
            {
                type: Sequelize.STRING,
                allowNull: false,
                primaryKey: true
            }
        }
    );
    return TutoringSubjects;
};
'use strict';

const Sequelize = require('sequelize');

module.exports = (sequelize) => {
    class User extends Sequelize.Model {}
    User.init({
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        firstName: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        lastName: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        emailAddress: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        password: {
            type: Sequelize.STRING,
            allowNull: false,
        },
    }, { sequelize });

    /** 
     * Within the User model, 
     * defines a HasMany association 
     * between the User and Course models 
     * (i.e. a "User" has many "Courses").
    */
   User.associate = (models) => {
       User.hasMany(models.Course, {
           foreignKey: {
               fieldName: 'userId',
               allowNull: false,
           },
       });
   };
    
    return User;
};
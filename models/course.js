'use strict';

const Sequelize = require('sequelize');

module.exports = (sequelize) => {
    class Course extends Sequelize.Model {}
    Course.init({
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        // userId: {
        //     type: Sequelize.INTEGER,
        // },
        title: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        estimatedTime: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        materialsNeeded: {
            type: Sequelize.STRING,
            allowNull: true,
        },
    }, { sequelize });  

    /**
     * Within your Course model, 
     * define a BelongsTo association 
     * between your Course and User models
     * (i.e. a "Course" belongs to a single "User").
     */
    Course.associate = (models) => {
        Course.belongsTo(models.User, {
            foreignKey:{
                fieldName: 'userId',
                allowNull: false,
            },
        });
    };
    
    return Course;
};
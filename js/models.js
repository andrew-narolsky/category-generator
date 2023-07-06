const sequelize = require('../js/db');
const { DataTypes } = require('sequelize');

const Page = sequelize.define('pages', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    url: {
        type: DataTypes.STRING
    },
    domain: {
        type: DataTypes.STRING
    },
    title: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    token: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },
    category: {
        type: DataTypes.STRING,
        defaultValue: ''
    }
});

const Job = sequelize.define('jobs', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        unique: true
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'SUCCESS', 'ERROR'),
        defaultValue: 'PENDING',
    },
});

Page.hasMany(Job);
Job.belongsTo(Page);

module.exports = { Page, Job }
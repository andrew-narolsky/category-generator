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
    text: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },
    category: {
        type: DataTypes.STRING,
        defaultValue: ''
    }
});

module.exports = { Page }
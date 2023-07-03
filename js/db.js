const { Sequelize } = require('sequelize');

module.exports = new Sequelize('sqlite::memory:');

// module.exports = new Sequelize({
//     dialect: 'sqlite',
//     storage: './data.db'
// });

'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('prices', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      ticker: {
        type: Sequelize.STRING(4),
        allowNull: false
      },
      alt_btc: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      btc_usd: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      alt_usd: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      datetime: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      }
    }, {charset : 'utf8'});
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('prices');
  }
};

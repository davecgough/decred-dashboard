'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('stats', {
      ticker: {
        type: Sequelize.STRING(4),
        primaryKey: true,
        allowNull: false
      },
      btc_high: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      btc_low: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      btc_last: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      prev_day: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      btc_volume: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      usd_price: {
        type: Sequelize.DOUBLE,
        allowNull: false
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
    return queryInterface.dropTable('stats');
  }
};

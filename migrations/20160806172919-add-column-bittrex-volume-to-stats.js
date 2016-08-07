'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('stats', 'bittrex_volume',
     { type: Sequelize.DOUBLE,
       allowNull : true
     });
  },

  down: function (queryInterface, Sequelize) {
      return queryInterface.removeColumn('stats', 'bittrex_volume');
  }
};

'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return [
      queryInterface.addColumn(
        'blocks',
        'min_fee',
        {
          type: Sequelize.DOUBLE,
          allowNull: true
        }
      ),
      queryInterface.addColumn(
        'blocks',
        'avg_fee',
        {
          type: Sequelize.DOUBLE,
          allowNull: true
        }
      ),
      queryInterface.addColumn(
        'blocks',
        'max_fee',
        {
          type: Sequelize.DOUBLE,
          allowNull: true
        }
      ),
      queryInterface.addColumn(
        'blocks',
        'median_fee',
        {
          type: Sequelize.DOUBLE,
          allowNull: true
        }
      )
    ];
  },

  down: function (queryInterface, Sequelize) {
    return [
      queryInterface.removeColumn('blocks', 'min_fee'),
      queryInterface.removeColumn('blocks', 'avg_fee'),
      queryInterface.removeColumn('blocks', 'max_fee'),
      queryInterface.removeColumn('blocks', 'median_fee')
    ];
  }
};

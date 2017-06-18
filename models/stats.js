"use strict";

module.exports = function(sequelize, DataTypes) {
  var Stats = sequelize.define('Stats', {
    ticker: {
      type: DataTypes.STRING(4),
      primaryKey: true,
      allowNull: false
    },
    btc_high: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    btc_low: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    btc_last: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    prev_day: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    btc_volume: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    usd_price: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE
    },
    updatedAt: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'stats'
  });

  return Stats;
};

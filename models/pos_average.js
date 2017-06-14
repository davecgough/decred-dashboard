"use strict";

module.exports = function(sequelize, DataTypes) {
  var PosAvg = sequelize.define('PosAvg', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    day: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    timestamp: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE
    },
    updatedAt: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'pos_average'
  });

  return PosAvg;
};

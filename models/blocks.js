"use strict";

module.exports = function(sequelize, DataTypes) {
  var Blocks = sequelize.define('Blocks', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    hash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    datetime: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    voters: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    yes_votes: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    num_tickets: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    poolsize: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sbits: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    difficulty: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    estimated_ticket_price: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE
    },
    updatedAt: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'blocks'
  });

  return Blocks;
};

"use strict";

var fs = require('fs');
var path = require('path');
var moment = require('moment');
var express = require('express');
var router = express.Router();

var sequelize = require('../models').sequelize;
var Stats = require('../models').Stats;
var Prices = require('../models').Prices;


router.get('/prices', function (req, res) {
  var ticker = req.query.ticker;
  var time = req.query.time;
  if (!time || time < 7 || time > 365) {
    time = 365 * 30; // 30 years
  }
  var min_time = new Date().getTime() - time * 24 * 60 * 60 * 1000;

  if (ticker != 'btc' && ticker != 'usd') {
    res.status(500).json({error : true});
    return;
  }
  fs.readFile('./uploads/market-cap.json', 'utf8', function (err, data) {
    if (err) {
      console.log(err);
      res.status(500).json({error : true}); return;
    }
    try {
      var result = JSON.parse(data);
    } catch(e) {
      console.log(e);
      res.status(500).json({error : true});
      return;
    }
    if (ticker === 'usd') {
      result = result.usd_price;
    } else {
      result = result.btc_price;
    }
    result = result.filter(function(item) {
      return (item[0] > min_time) ? true : false;
    });
    res.status(200).json(result);
  });
});

router.get('/day_price', function(req, res) {
  var ticker = req.query.ticker;
  var time = req.query.time;

  if (ticker != 'btc' && ticker != 'usd') {
    res.status(500).json({error : true});
    return;
  }
  if (!time || time < 1 || time > 7) {
    time = 1;
  }

  Prices.findAll({order : 'datetime DESC', limit : (96 * time)}).then(function(rows) {
    let result = [];

    for (let row of rows) {
      result.push([row.datetime * 1000, row[ticker]]);
    }
    result.reverse();
    res.status(200).json(result);
  }).catch(function(err) {
    console.error(err);
    res.status(500).json({error : true});
  });
});

router.get('/get_stats', function (req, res) {
  Stats.findOne({where : {id : 1}}).then(function(stats) {

    if (!stats) {
      res.status(500).json({error : true});
      return;
    }

      stats = stats.dataValues;

      res.status(200).json(stats);
  }).catch(function(err) {
    console.error(err);
    res.status(500).json({error : true});
  });
});

router.get('/convert', function(req, res) {

  if (!req.query) {
    res.status(500).json({error : true}); return;
  }
  var alt = 0;
  var pair = 0;
  if (req.query.from == 'alt') {
    alt = parseFloat(req.query.alt);
    pair = (alt * USD * parseFloat(RATES[req.query.to])).toFixed(2);
  } else {
    pair = req.query.pair;
    alt = (req.query.pair / parseFloat(RATES[req.query.to]) / USD).toFixed(2);
  }
  res.json({alt : alt, result : pair});
});


// forex rate cache
var USD = 0;
var RATES = {};

function updatePriceCache() {
  fs.readFile('./uploads/rates.json', 'utf8', function (err, data) {
    if (err) {
      console.log(err);
      res.status(500).json({error : true}); return;
    }
    var result = {};
    try {
      result = JSON.parse(data);
    } catch(e) {
      console.log(e);
      res.status(500).json({error : true});
      return;
    }
    Stats.findOne({where : {id : 1}}).then(function(stats) {
      USD = parseFloat(stats.usd_price) * parseFloat(stats.btc_last);
      RATES = result.rates;
    }).catch(function(err) { console.log(err); });
  });
}

var updateCacheInterval = setInterval(updatePriceCache, 60000);
updatePriceCache();


module.exports = router;

"use strict";

var fs = require('fs');
var path = require('path');
var moment = require('moment');
var express = require('express');
var router = express.Router();

var sequelize = require('../models').sequelize;
var Blocks = require('../models').Blocks;
var Stats = require('../models').Stats;
var Prices = require('../models').Prices;

const SUPPLY = 21000000;
const FIRST_BLOCK_TIME = 1454954535;
const SUBSIDY = 31.19582664;
const PREMINE = 1680000;
/* (4095 - 1) blocks * 21.83707864 DCR ~ 89401 */
const MINED_DCR_BEFORE_POS = 89401;
const DCR_TOTAL = PREMINE + MINED_DCR_BEFORE_POS;

const colors = ['#3c4ba6','#8c93c0','#ddc38c','#c6a55e','#b8ada3'];

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
  fs.readFile('./uploads/prices.json', 'utf8', function (err, data) {
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
      result.push([row.datetime * 1000, row['dcr_' + ticker]]);
    }
    result.reverse();
    res.status(200).json(result);
  }).catch(function(err) {
    console.error(err);
    res.status(500).json({error : true});
  });
});

router.get('/estimated_ticket_price', function (req, res) {
  res.status(404).json({error : true, message: "Feature disabled"});
  return;

  console.log('Estimated ticket price start: ', (new Date()).getTime());
  let query = {
    attributes: ['datetime', 'estimated_ticket_price'],
    order: 'height DESC',
    limit: 720
  };
  Blocks.findAll(query).then(function(blocks) {
    var result = [];
    for (let row of blocks) {
      result.push([row.datetime * 1000,row.estimated_ticket_price]);
    }
    console.log('Estimated ticket price end: ', (new Date()).getTime());
    res.status(200).json(result);
  }).catch(function(err) {
    console.log(err);
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

var USD = 0;
var RATES = {};

// JHTODO this needs to go back in
// Actually it seems like it probably wont
//
//
// function updatePriceCache() {
//   fs.readFile('./uploads/rates.json', 'utf8', function (err, data) {
//     if (err) {
//       console.log(err);
//       res.status(500).json({error : true}); return;
//     }
//     var result = {};
//     try {
//       result = JSON.parse(data);
//     } catch(e) {
//       console.log(e);
//       res.status(500).json({error : true});
//       return;
//     }
//     Stats.findOne({where : {id : 1}}).then(function(stats) {
//         console.error("JHTODO STATS STILL == NULL");
//       else {
//         console.error("\n\n\n\nJHTODO STATS IS NOT NULL!!!!\n\n\n\n");
//         USD = parseFloat(stats.usd_price) * parseFloat(stats.btc_last);
//         RATES = result;
//       }
//     }).catch(function(err) { console.log(err); });
//   });
// }

// var updateCacheInterval = setInterval(updatePriceCache, 60000);
// updatePriceCache();

function getEstimatedBlockReward(cycles, reward) {
  if (cycles) {
    reward = reward * 100/101;
    return getEstimatedBlockReward(cycles - 1, reward);
  } else {
    return reward;
  }
}

router.get('/convert', function(req, res) {

  if (!req.query) {
    res.status(500).json({error : true}); return;
  }
  var dcr = 0;
  var pair = 0;
  if (req.query.from == 'dcr') {
    dcr = parseFloat(req.query.dcr);
    pair = (dcr * USD * parseFloat(RATES[req.query.to])).toFixed(2);
  } else {
    pair = req.query.pair;
    dcr = (req.query.pair / parseFloat(RATES[req.query.to]) / USD).toFixed(2);
  }
  res.json({dcr : dcr, result : pair});
});

router.get('/app_notifications', function(req, res) {
  let json = {
    'start_date' : '1470062077',
    'end_date' : '1470252001',
    'image' : 'https://decred.dcrstats.com/img/be-the-lion.png',
    'url' : 'https://stakepool.dcrstats.com/',
    'text' : ''
  };

  res.status(200).json(json);
});

module.exports = router;

"use strict";

var fs = require('fs');
var path = require('path');
var moment = require('moment');
var CronJob = require('cron').CronJob;
var express = require('express');
var router = express.Router();

var sequelize = require('../models').sequelize;
var Stats = require('../models').Stats;
var Prices = require('../models').Prices;

var dcr_profile = require("../public/strings/dcr-profile.json");
var gnt_profile = require("../public/strings/gnt-profile.json");
var profiles = [ dcr_profile, gnt_profile];

function get_profile(req) {
  if (req.query.c) {
    return req.query.c;
  } else {
    return "GNT";
  }
};

router.get('/prices', function (req, res) {
  var ticker = req.query.ticker;
  var time = req.query.time;

  if (!time || time < 7 || time > 365) {
    time = 10950; // 30 years
  }
  var min_time = new Date().getTime() - time * 24 * 60 * 60 * 1000;

  if (ticker != 'btc' && ticker != 'usd') {
    res.status(500).json({error : true});
    return;
  }

  var resp;
  if (ticker === 'usd') {
    resp = MARKET_CAP[get_profile(req)].usd_price;
  } else {
    resp = MARKET_CAP[get_profile(req)].btc_price;
  }

  resp = resp.filter(function(item) {
    return (item[0] > min_time) ? true : false;
  });
  res.status(200).json(resp);

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

  Prices.findAll({ where: { ticker: get_profile(req) }, order : 'datetime DESC', limit : (96 * time)}).then(function(rows) {
    let result = [];

    for (let row of rows) {
      result.push([row.datetime * 1000, row["alt_" + ticker]]);
    }
    result.reverse();
    res.status(200).json(result);
  }).catch(function(err) {
    console.error(err);
    res.status(500).json({error : true});
  });
});

router.get('/get_stats', function (req, res) {
  Stats.findOne({where : {ticker: get_profile(req)}}).then(function(stats) {

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
    alt = (req.query.pair / parseFloat(RATES[req.query.to]) / USD[get_profile(req)]).toFixed(2);
  }
  res.json({alt : alt, result : pair});
});

// market-cap.json cache
var MARKET_CAP = {};
function updateMarketCapCache() {
  for (var i = 0; i < profiles.length; i++) {
    fs.readFile('./uploads/' + profiles[i].alt_ticker + '-market-cap.json', 'utf8', function (err, data) {
      if (err) {
        console.error(err);
        return;
      }

      var result = {};
      try {
        result = JSON.parse(data);
      } catch(e) {
        console.error(e);
        return;
      }
      
      MARKET_CAP[this.profile.alt_ticker] = result;
    }.bind({profile: profiles[i]}));
  }
}

// rates.json cache
var USD = {};
var RATES = {};
function updateForexCache() {
  fs.readFile('./uploads/rates.json', 'utf8', function (err, data) {
    if (err) {
      console.error(err);
      return;
    }

    var result = {};
    try {
      result = JSON.parse(data);
    } catch(e) {
      console.error(e);
      return;
    }
    RATES = result.rates;
  });

  Stats.findAll().then(function(stats) {
    for (stat in stats){
      USD[stat.ticker] = parseFloat(stat.usd_price) * parseFloat(stat.btc_last);
    }
  })
  .catch(function(err) {
    console.error("Failed to create forex cache"); 
  });
    
}

new CronJob('10 * * * * *', updateMarketCapCache, null, true, 'Europe/Rome');
new CronJob('10 * * * * *', updateForexCache, null, true, 'Europe/Rome');
updateForexCache();
updateMarketCapCache();

module.exports = router;

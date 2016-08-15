"use strict";

var fs = require('fs');
var path = require('path');
var moment = require('moment');
var express = require('express');
var router = express.Router();

var sequelize = require('../models').sequelize;
var Blocks = require('../models').Blocks;
var Stats = require('../models').Stats;
var Hashrate = require('../models').Hashrate;
var Pools = require('../models').Pools;
var Prices = require('../models').Prices;

const SUPPLY = 21000000;
const FIRST_BLOCK_TIME = 1454954535;
const SUBSIDY = 31.19582664;
const PREMINE = 1680000;
/* (4095 - 1) blocks * 21.83707864 DCR ~ 89401 */
const MINED_DCR_BEFORE_POS = 89401;
const DCR_TOTAL = PREMINE + MINED_DCR_BEFORE_POS;

const colors = ['#3c4ba6','#8c93c0','#ddc38c','#c6a55e','#b8ada3'];

router.get('/pos', function (req, res) {
  var result = {};
  var sbits = [];
  if (!req.query.time || req.query.time == '365') {
    var query = `SELECT DISTINCT(sbits), MIN(datetime) as datetime
             from blocks group by sbits order by datetime asc`;
  } else {
    var day = parseInt(req.query.time);
    if (isNaN(day)) {
      day = 365;
    }

    var datetime = Math.floor((new Date()) / 1000) - day * 24 * 60 * 60;
    var query = `SELECT DISTINCT(sbits), MIN(datetime) as datetime
             from blocks ` + `WHERE datetime >= ` + datetime + ` group by sbits order by datetime asc`;
  }

  sequelize.query(query, { model: Blocks }).then(function(prices) {
    for (let row of prices) {
      /* if date is 8 FEB, set it to 23 FEB
       * just to beautify a little chart, because PoS diff adjustment
       * started only after 4895 block */
      if (row.datetime == 1454954535) {
        row.datetime = 1456228800;
      }
      sbits.push([row.datetime * 1000, row.sbits]);
    }
    result.sbits = sbits;
    res.status(200).json(result);
    return;
  }).catch(function(err) {
    console.log(err);
    res.status(500).json({error : true});
  });
});

router.get('/difficulty', function(req, res) {
  if (!req.query.time || req.query.time == '365') {
    var query = `SELECT DISTINCT(difficulty), MIN(datetime) as datetime
             from blocks group by difficulty order by datetime asc`;
  } else {
    var day = parseInt(req.query.time);
    if (isNaN(day)) {
      day = 365;
    }
    var datetime = Math.floor((new Date()) / 1000) - day * 24 * 60 * 60;
    var query = `SELECT DISTINCT(difficulty), MIN(datetime) as datetime
             from blocks ` + `WHERE datetime >= ` + datetime + ` group by difficulty order by datetime asc`;
  }

  sequelize.query(query, { model: Blocks }).then(function(data) {
    var result = [];
    for (let block of data) {
      result.push([block.datetime * 1000, block.difficulty]);
    }
    return res.status(200).json(result);
  }).catch(function(err) {
    console.log(err);
    res.status(500).json({error : true});
  });
});

router.get('/hashrate', function(req, res) {
  if (!req.query.time || req.query.time == '365') {
    var query = `SELECT DISTINCT(networkhashps), MIN(timestamp) as timestamp
                 from hashrate group by networkhashps order by timestamp asc`;
  } else {
    var day = parseInt(req.query.time);
    if (isNaN(day)) {
      day = 365;
    }
    var datetime = Math.floor((new Date()) / 1000) - day * 24 * 60 * 60;
    var query = `SELECT DISTINCT(networkhashps), MIN(timestamp) as timestamp
             from hashrate ` + `WHERE timestamp >= ` + datetime + ` group by networkhashps order by timestamp asc`;
  }

  sequelize.query(query, { model: Hashrate }).then(function(data) {
    var result = [];
    for (let block of data) {
      result.push([block.timestamp * 1000, block.networkhashps / 1000 / 1000 / 1000 / 1000]);
    }
    return res.status(200).json(result);
  }).catch(function(err) {
    console.log(err);
    res.status(500).json({error : true});
  });
});

router.get('/pools', function(req, res) {
  Stats.findOne({where : {id : 1}}).then(function(stats) {
    Pools.findAll({order: 'hashrate DESC'}).then(function(pools) {
      var networkTotal = Math.round((stats.networkhashps / 1000 / 1000 / 1000) * 100) / 100;
      var result = [];
      var total = 0;
      var hashrate = 0;
      var index = 0;
      for (let pool of pools) {
        total += pool.hashrate;
        hashrate = Math.round(pool.hashrate * 100) / 100;
        result.push({workers: pool.workers, name : pool.name, y : hashrate, network: networkTotal, color : colors[index]});
        index++;
      }
      var soloMiners = Math.round((stats.networkhashps / 1000 / 1000 / 1000 - total) * 100) / 100;
      if (soloMiners > 0) {
        result.push({
          workers: '-',
          name : 'Solo miners',
          y : soloMiners
        });
      }
      return res.status(200).json(result);
    }).catch(function(err) {
      console.log(err);
      res.status(500).json({error : true}); return;
    });
  }).catch(function(err) {
    console.error(err);
    res.status(500).json({error : true}); return;
  });
});

router.get('/prices', function (req, res) {
  var ticker = req.query.ticker;
  var time = req.query.time;
  if (!time || time < 7 || time > 365) {
    time = 365;
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
  if (req.query.origin) {
    console.log('[API]: get_stats request from ' + req.query.origin);
  }
  Stats.findOne({where : {id : 1}}).then(function(stats) {

    if (!stats) {
      res.status(500).json({error : true});
      return;
    }

    Blocks.findOne({order: 'height DESC'}).then(function(block) {
      stats = stats.dataValues;
      if (stats.bittrex_volume) {
        stats.btc_volume += stats.bittrex_volume;
      }
      stats.last_block_datetime = block.datetime;
      stats.average_time = Math.floor((block.datetime - FIRST_BLOCK_TIME) / block.height);
      stats.average_minutes = Math.floor(stats.average_time / 60);
      stats.average_seconds = Math.floor(stats.average_time % 60);
      stats.poolsize = block.poolsize;
      stats.sbits = block.sbits;
      stats.supply = SUPPLY;
      stats.premine = PREMINE;
      stats.mined_before_pos = MINED_DCR_BEFORE_POS;
      stats.reward = SUBSIDY;

      res.status(200).json(stats);
    });
  }).catch(function(err) {
    console.error(err);
  });
});

router.get('/peerinfo', function(req, res) {
  res.sendFile(path.normalize(__dirname + '/../uploads/peers.json'));
});

router.get('/price', function(req, res) {
  Prices.findOne({order : 'datetime DESC'}).then(function(price) {
    let result = {
      dcr_btc : price.dcr_btc,
      btc_usd : price.btc_usd,
      dcr_usd : price.dcr_usd,
      datetime : price.datetime
    };
    res.status(200).json(result);
  }).catch(function(err) {
    console.error(err);
  });
});

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
      RATES = result;
    }).catch(function(err) { console.log(err); });
  });
}

var updateCacheInterval = setInterval(updatePriceCache, 60000);
updatePriceCache();

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

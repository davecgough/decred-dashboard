"use strict";

var fs = require("fs");
var path = require("path");
var moment = require("moment");
var CronJob = require("cron").CronJob;
var express = require("express");
var router = express.Router();

var sequelize = require("../models").sequelize;
var Stats = require("../models").Stats;
var Prices = require("../models").Prices;
console.log ("NODE_ENV='"+process.env.NODE_ENV+"'")
var env = process.env.NODE_ENV || "development";
if (env != "production" && env != "development"){
  env = "development";
}
var config = require("../config/config.json");

var p = require("../config/profiles.json");
var profiles = {};
for (var i=0; i< p.length; i++) {
  profiles[p[i].alt_ticker] = p[i];
}

function get_profile(req) {
  if (req.query.c) {
    if (profiles[req.query.c] == undefined) {
      return profiles[config.default_profile];
    } else {
      return profiles[req.query.c];
    }
  } else {
    return profiles[config.default_profile];
  }
}

router.get("/prices", function (req, res) {
  var profile = get_profile(req);
  if (MARKET_CAP[profile.alt_ticker] == undefined) {
    console.error("API(prices):", "MARKET_CAP cache not initialised yet")
    res.status(500).json({error : true});
    return;
  }

  var ticker = req.query.ticker;
  var time = req.query.time;

  if (!time || time < 7 || time > 365) {
    time = 10950; // 30 years
  }
  var min_time = new Date().getTime() - time * 24 * 60 * 60 * 1000;

  if (ticker != "btc" && ticker != "usd") {
    res.status(500).json({error : true});
    return;
  }

  var resp;
  if (ticker === "usd") {
    resp = MARKET_CAP[profile.alt_ticker].usd_price;
  } else {
    resp = MARKET_CAP[profile.alt_ticker].btc_price;
  }

  resp = resp.filter(function(item) {
    return (item[0] > min_time) ? true : false;
  });

  res.status(200).json(resp);
});

router.get("/day_price", function(req, res) {
  var ticker = req.query.ticker;
  var time = req.query.time;

  if (ticker != "btc" && ticker != "usd") {
    res.status(500).json({error : true});
    return;
  }
  if (!time || time < 1 || time > 7) {
    time = 1;
  }
  
  var profile = get_profile(req);

  Prices.findAll({ where: { ticker: profile.alt_ticker }, order :"datetime DESC", limit : (96 * time)}).then(function(rows) {
    let result = [];

    for (let row of rows) {
      result.push([row.datetime * 1000, row["alt_" + ticker]]);
    }
    result.reverse();
    res.status(200).json(result);
  }).catch(function(err) {
    console.error("API(day_price):", err);
    res.status(500).json({error : true});
  });
});

router.get("/get_stats", function (req, res) {
  var profile = get_profile(req);
  Stats.findOne({where : {ticker: profile.alt_ticker}}).then(function(stats) {

    if (!stats) {
      res.status(500).json({error : true});
      return;
    }

      stats = stats.dataValues;

      res.status(200).json(stats);
  }).catch(function(err) {
    console.error("API(get_stats):", err);
    res.status(500).json({error : true});
  });
});

router.get("/convert", function(req, res) {
  if (!req.query) {
    res.status(500).json({error : true}); return;
  }
  var profile = get_profile(req);
  if (USD[profile.alt_ticker] == null || USD[profile.alt_ticker] == undefined) {
    console.error("API(convert)", "USD rate cache not initialised");
    res.status(500).json({error : true}); return;
  }
  if (RATES == null || RATES[req.query.to] == undefined) {
    console.error("API(convert)", "Forex cache not initialised");
    res.status(500).json({error : true}); return;
  }
  
  var alt = 0;
  var pair = 0;
  var profile = get_profile(req);
  if (req.query.from == "alt") {
    alt = parseFloat(req.query.alt);
    pair = (alt * USD[profile.alt_ticker] * parseFloat(RATES[req.query.to])).toFixed(2);
  } else {
    pair = req.query.pair;
    alt = (req.query.pair / parseFloat(RATES[req.query.to]) / USD[profile.alt_ticker]).toFixed(2);
  }
  res.json({alt : alt, result : pair});
});

// market-cap.json cache
var MARKET_CAP = {};
function marketCapCache() {
  for (var key in profiles) {
    fs.readFile("./cache/" + profiles[key].alt_ticker + "-market-cap.json", "utf8", function (err, data) {
      if (err) {
        console.error("marketCapCache:", "Could not open " + "./cache/" + this.profile.alt_ticker + "-market-cap.json");
        return;
      }

      var result = {};
      try {
        result = JSON.parse(data);
      } catch(e) {
        console.error("marketCapCache:", e);
        return;
      }
      MARKET_CAP[this.profile.alt_ticker] = result;
    }.bind({profile: profiles[key]}));
  }
}

// rates.json cache
var RATES = null;
function forexCache() {
  fs.readFile("./cache/rates.json", "utf8", function (err, data) {
    if (err) {
      console.error("forexCache:", "Could not open ./cache/rates.json");
      return;
    }

    var result = {};
    try {
      result = JSON.parse(data);
    } catch(e) {
      console.error("forexCache:", e);
      return;
    }

    RATES = result.rates;
    RATES["USD"] = 1;
  });
}

var USD = [];
function usdCache() {
  Stats.findAll().then(function(stats) {
    if (stats.length == 0) {
      console.error("usdCache:", "Nothing in stats table");
      return;
    }

    for (var i=0;i<stats.length;i++){
      USD[stats[i].ticker] = parseFloat(stats[i].usd_price) * parseFloat(stats[i].btc_last);
    }
  })
  .catch(function(err) {
    console.error("usdCache:", err); 
  });
    
}

if (env == "production"){
  // Production timings
  new CronJob("0 */14 * * * *", marketCapCache, null, true, "Europe/Rome");
  new CronJob("0 */14 * * * *", forexCache, null, true, "Europe/Rome");
  new CronJob("*/10 * * * * *", usdCache, null, true, "Europe/Rome");
} else {
  // Dev timings
  new CronJob("*/10 * * * * *", marketCapCache, null, true, "Europe/Rome");
  new CronJob("*/10 * * * * *", forexCache, null, true, "Europe/Rome");
  new CronJob("*/10 * * * * *", usdCache, null, true, "Europe/Rome");
}

forexCache();
usdCache();
marketCapCache();

module.exports = router;

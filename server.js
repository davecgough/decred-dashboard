"use strict";

var express = require("express");
var request = require("request");
var moment  = require("moment");
var CronJob = require("cron").CronJob;
var fs = require("fs");

var api = require("./routes/api.js");
var site = require("./routes/site.js");
var env = process.env.NODE_ENV || "development";
var config = require("./config/config.json")[env];

var p = require("./config/profiles.json");
var profiles = {};
for (var i=0; i< p.length; i++) {
  profiles[p[i].alt_ticker] = p[i];
}

var app = express();
app.set("views", "./public/views");
app.set("view engine", "jade");
app.locals.moment = moment;

console.log("Starting app in " + env + " environment.");
// in production we are using Nginx to deliver static files
if (env == "development") {
  app.use(express.static("public"));
}

var sequelize = require("./models").sequelize;
var Stats = require("./models").Stats;
var Prices = require("./models").Prices;

app.use("/api/v1", api);
app.use("", site); // site must go last because it contains catchall for 404

const MARKET_CAP = "https://graphs.coinmarketcap.com/currencies/";
const POLONIEX = "https://poloniex.com/public?command=returnTicker";
const BITSTAMP = "https://www.bitstamp.net/api/v2/ticker/btcusd/";
const FOREX_API = "http://api.fixer.io/latest?base=USD";

function getUsdBtcPrice(next) {
  request(BITSTAMP, function (error, response, body) {
    if (error || response.statusCode != 200) {
       return next(error, null);
    }

    try {
      var data2 = JSON.parse(body);
    } catch(e) {
      return next(e,null);
    }

    if (!data2) {
      return next(body,null);
    }

    var usdbtc_price = parseFloat(data2.last);

    return next(null, usdbtc_price);
  });
}

var updateStats = function() {
  getUsdBtcPrice(function(err, usdbtc_price) {
    if (err) {
      console.error("updateStats:", err);
      return;
    }

    getPrices(function(err, resp) {
      if (err) {
        console.error("updateStats:", err);
        return;
      }
      
      var newRows = [];

      for (var key in profiles) {
        var data = resp[profiles[key].polo_id];
        if (!data) {
          console.error("updateStats:", "No data for profile:" + profiles[key].alt_ticker)
          continue;
        }

        var result = {};
        result.ticker = profiles[key].alt_ticker;
        result.usd_price = usdbtc_price;
        
        result.btc_high = data["high24hr"];
        result.btc_low = data["low24hr"];
        result.btc_last = data["last"];
        result.btc_volume = data["baseVolume"];
        result.prev_day = (parseFloat(data["percentChange"]) * 100).toFixed(2);
        newRows.push(result);
      }

      for (var i = 0; i < newRows.length; i++) {
        //console.log("updateStats:", "writing " + newRows[i].ticker + " stats");
        Stats.upsert(newRows[i]).catch(function(err) {
          console.error("updateStats:", err);
        });
      }
    });    
  });

}

function getPrices(next) {
  // Get BTC/ALT from polo
  request(POLONIEX, function (error, response, body) {
    if (!error && response.statusCode == 200) {

      try {
        var data = JSON.parse(body);
      } catch(e) {
        return next(e,null);
      }

      return next(null, data);
    } else {
      return next(error, null);
    }
  });

}

function updateMarketCap() {
  for (var key in profiles) {
    request(MARKET_CAP + profiles[key].market_cap_id, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        try {
          var file_name = this.profile.alt_ticker+"-market-cap.json";
          let json = JSON.parse(body);
          json = JSON.stringify({usd_price : json.price_usd, btc_price : json.price_btc});
          fs.writeFile("./cache/"+file_name, json, function(err) {
              if(err) {
                return console.error("updateMarketCap:", err);
              }
              //return console.log("updateMarketCap:", "Saved market cap data in " + file_name);
          });

        } catch(e) {
          console.error("updateMarketCap:", e); return;
        }
      }
    }.bind({profile: profiles[key]}));
  }
}

function updatePrices() {
  Stats.findAll().then(function(stats) {
    if (stats == null | stats.length == 0) {
      console.error("updatePrices:", "Nothing in stats table. Cant update 15 min price");
      return;
    }
    
    var newRows = [];
    for (var i=0; i < stats.length; i++) {
      var data = {
        ticker: stats[i].ticker,
        alt_btc : stats[i].btc_last,
        btc_usd : stats[i].usd_price,
        alt_usd : (stats[i].btc_last * stats[i].usd_price),
        datetime : Math.floor(new Date().getTime() / 1000)
      };
      newRows.push(data);
    }
    
    return Prices.bulkCreate(newRows).then(function(rows) {
      // for (var i=0; i<rows.length; i++) {
      //   console.log("updatePrices:", "Saved " + rows[i].ticker + " price: " + rows[i].alt_usd);
      // }
    }).catch(function(err) {
      console.error("updatePrices:", err);
    });

  }).catch(function(err) {
    console.error("updatePrices:", err);
  });
}

function updateForexRates() {
  request(FOREX_API, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      try {
        JSON.parse(body);
      } catch(e) {
        console.error("updateForexRates:", "Bad response from forex provider", e);
        return;
      }

      fs.writeFile("./cache/rates.json", body, function(err) {
          if(err) {
              return console.error("updateForexRates:", err);
          }
          //return console.log("updateForexRates:", "USD forex rates updated.");
      });

    } else {
      console.error("updateForexRates:", "Bad response from forex provider", response);
    }
  });
}


// Original timings
new CronJob("*/15 * * * * *", updateStats, null, true, "Europe/Rome");
// new CronJob("0 */15 * * * *", updatePrices, null, true, "Europe/Rome");
// new CronJob("0 */15 * * * *", updateMarketCap, null, true, "Europe/Rome");
// new CronJob("5 */60 * * * *", updateForexRates, null, true, "Europe/Rome");

new CronJob("*/10 * * * * *", updatePrices, null, true, "Europe/Rome");
new CronJob("*/10 * * * * *", updateMarketCap, null, true, "Europe/Rome");
new CronJob("*/20 * * * * *", updateForexRates, null, true, "Europe/Rome");

app.listen(config.listen_port, function () {
  console.log("Listening on port " + config.listen_port);
});
module.exports = app;

"use strict";

var express = require('express');
var request = require('request');
var moment  = require('moment');
var CronJob = require('cron').CronJob;
var fs = require('fs');

var api = require('./routes/api.js');
var site = require('./routes/site.js');
var env = process.env.NODE_ENV || 'development';
var config = require('./config/config.json')[env];

var app = express();
app.set('views', './public/views');
app.set('view engine', 'jade');
app.locals.moment = moment;

console.log('Starting app in ' + env + ' environment.');
// in production we are using Nginx to deliver static files
if (env == 'development') {
  app.use(express.static('public'));
}

var sequelize = require('./models').sequelize;
var Stats = require('./models').Stats;
var Prices = require('./models').Prices;

app.use('', site);
app.use('/api/v1', api);

const POLO_ID = "BTC_GNT";
const MARKET_CAP_ID = "golem-network-tokens";

const MARKET_CAP = 'https://graphs.coinmarketcap.com/currencies/' + MARKET_CAP_ID;
const POLONIEX = 'https://poloniex.com/public?command=returnTicker';
const BITSTAMP = 'https://www.bitstamp.net/api/v2/ticker/btcusd/';
const APILAYER = 'http://apilayer.net/api/live?access_key=';

var updatePrices = function() {
  getPrices(function(err, result) {
    if (err) {
      console.error(err);
      return;
    } else {
      Stats.findOrCreate({where : {id : 1}, defaults : result }).spread(function(stats, created) {
          console.log("updatePrices: updating stats table")
          return stats.update(result).catch(function(err) {
          console.error(err);
        });
      }).catch(function(err) {
        console.error(err);
      });

    }
  });
}

var updateMarketCap2 = function() {
  updateMarketCap();
  saveMarketPrice();
}

// Original timings
new CronJob('*/15 * * * * *', updatePrices, null, true, 'Europe/Rome');
new CronJob('0 */15 * * * *', updateMarketCap2, null, true, 'Europe/Rome');
// new CronJob('5 */60 * * * *', updateExchangeRates, null, true, 'Europe/Rome');

function getPrices(next) {
  var result = {};

  // Get BTC/ALT from polo
  request(POLONIEX, function (error, response, body) {
    if (!error && response.statusCode == 200) {

      try {
        var data = JSON.parse(body);
      } catch(e) {
        return next(e,null);
      }

      data = data[POLO_ID];
      if (!data) {
        return next(body,null);
      }
      result.btc_high = data['high24hr'];
      result.btc_low = data['low24hr'];
      result.btc_last = data['last'];
      result.btc_volume = data['baseVolume'];
      result.prev_day = (parseFloat(data['percentChange']) * 100).toFixed(2);

      // Get USD/BTC from bitstamp
      request(BITSTAMP, function (error, response, body) {
        if (!error && response.statusCode == 200) {

          try {
            var data2 = JSON.parse(body);
          } catch(e) {
            return next(e,null);
          }

          if (!data2) {
            return next(body,null);
        }

          result.usd_price = parseFloat(data2.last);

          return next(null, result);
        } else {
           return next(error, null);
        }
      });

    } else {
      return next(error, null);
    }
  });

}

function updateMarketCap() {
  request(MARKET_CAP, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      try {
        let json = JSON.parse(body);
        json = JSON.stringify({usd_price : json.price_usd, btc_price : json.price_btc});
        fs.writeFile("./uploads/market-cap.json", json, function(err) {
            if(err) {
                return console.error(err);
            }
            return console.log("updateMarketCap: Saved market cap data in market-cap.json.");
        });

      } catch(e) {
        console.error('updateMarketCap: ', e); return;
      }
    }
  });
}

function saveMarketPrice() {
  Stats.findOne({where : {id : 1}}).then(function(stats) {
    if (stats == null) {
      console.error("updateMarketCap: nothing in stats table. Cant update 15 min price");
      return;
    }

    var data = {
      alt_btc : stats.btc_last,
      btc_usd : stats.usd_price,
      alt_usd : (stats.btc_last * stats.usd_price),
      datetime : Math.floor(new Date().getTime() / 1000)
    };

    return Prices.create(data).then(function(row) {
      console.log('updateMarketCap: Saved 15-mins market price');
    }).catch(function(err) {
      console.error(err);
    });

  }).catch(function(err) {
    console.error(err);
  });
}

// function updateExchangeRates() {
//   request(APILAYER + config.currencylayer_key, function (error, response, body) {
//     if (!error && response.statusCode == 200) {
//       var json = {};
//       try {
//         json = JSON.parse(body);
//         if (!json.quotes) throw new Error('Empty quotes');
//         json = JSON.stringify(json.quotes);
//       } catch(e) {
//         console.error('Bad response from apilayer.net', e);
//         return;
//       }

//       fs.writeFile("./uploads/rates.json", json, function(err) {
//           if(err) {
//               return console.error(err);
//           }
//           return console.log("Exchange rates updated.");
//       });

//     } else {
//       console.log('Bad response from apilayer.net', response);
//     }
//   });
// }

app.listen(config.listen_port, function () {
  console.log('Listening on port ' + config.listen_port);
});

module.exports = app;

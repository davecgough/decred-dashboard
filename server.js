"use strict";

var express = require('express');
var request = require('request');
var moment  = require('moment');
var exec    = require('child_process').exec;
var CronJob = require('cron').CronJob;
var fs = require('fs');
var geoip = require('geoip-lite');

var api = require('./routes/api.js');
var site = require('./routes/site.js');
var strings = require('./public/strings/seo.json');
var env = process.env.NODE_ENV || 'development';
var config = require('./config/config.json')[env];

var rpc_cert = fs.readFileSync(config.rpc_cert);
var rpc_user = config.rpc_user;
var rpc_password = config.rpc_password;

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
var Blocks = require('./models').Blocks;
var Stats = require('./models').Stats;
var Hashrate = require('./models').Hashrate;
var Pools = require('./models').Pools;
var Prices = require('./models').Prices;

const POLONIEX = 'https://poloniex.com/public?command=returnTicker';
const BITTREX = 'https://bittrex.com/api/v1.1/public/getmarketsummary?market=btc-dcr';
const BTCE = 'https://btc-e.com/api/3/ticker/btc_usd';
const MARKET_CAP = 'https://api.coinmarketcap.com/v1/datapoints/decred/';
const GET_TX = 'https://mainnet.decred.org/api/tx/';
const APILAYER = 'http://apilayer.net/api/live?access_key=';

const SUPPLY = 21000000;
const FIRST_BLOCK_TIME = 1454954535;
const SUBSIDY = 31.19582664;
const PREMINE = 1680000;
/* (4095 - 1) blocks * 21.83707864 DCR ~ 89401 */
const MINED_DCR_BEFORE_POS = 89401;
const DCR_TOTAL = PREMINE + MINED_DCR_BEFORE_POS;

var BEST_HEIGHT = 0;

app.use('', site);
app.use('/api/v1', api);

var peersInterval = setInterval(function() {
      fs.readFile(config.seeder_dump_path, function(err, body) {
      if (err) { console.log(err); return; }
      try {
        var data = JSON.parse(body);
      } catch(e) {
        console.log(e); return;
      }
      console.log(data);
      if (!data || !data.length) { return; }

      var peers = data.map(function (val) {
        val.geo = geoip.lookup(val.ip.split(':')[0]);
        val.sync = val.best_block < BEST_HEIGHT ? 'behind' : 'ok';
        return val;
      });

      fs.writeFile("./uploads/peers.json", JSON.stringify(peers), function(err) {
        if(err) {
            console.error(err);
            return;
        }
        console.log("Peer list updated.");
        return;
      });
      });
}, 60 * 1000);

new CronJob('0 */1 * * * *', function() {
  /* Add new blocks */
  Blocks.findOne({order: 'height DESC', limit: 1}).then(function(block) {
    var newHeight = block ? (block.height + 1) : 1;
    console.log("Searching new blocks with height >= " + newHeight);
    findNewBlock(newHeight);
  }).catch(function(err) {
    console.log(err);
  });

  /* Count total missed tickets */
  checkMissedTickets();

  getStakepoolsStats();

}, null, true, 'Europe/Rome');

new CronJob('0 */5 * * * *', function() {
  /* Get average fees in the mempool */
  getAverageMempoolFees();

  /* Get PoS mempool */
  getStakepoolInfo();

  /* parse DCR-BTC volume from bittrex */
  getBittrexVolume();
}, null, true, 'Europe/Rome');

new CronJob('*/15 * * * * *', function() {
  console.log('Updating price stats.');
  getPrices(function(err, result) {
    if (err) {
      console.error('Error, could not update price and common statistic.');
      return;
    } else if (result) {
      Stats.findOrCreate({where : {id : 1}, defaults : result }).spread(function(stats, created) {
        var datetime = moment().subtract(30, 'days').unix();
        let query = {
          attributes: ['sbits',[sequelize.fn('SUM', sequelize.col('num_tickets')), 'num_tickets']],
          where: {
            height: {$gt : 4895},
            datetime: {$gt : datetime}
          },
          group: ['sbits'],
          order: 'sbits ASC'
        };

        Blocks.findAll(query).then(function(all_blocks) {
            /* Calculate 30-days volume-weighted average ticket price */
            var q = 0;
            var pq = 0;
            for (let item of all_blocks) {
              pq += item.sbits * parseInt(item.num_tickets, 10);
            	q  += parseInt(item.num_tickets, 10);
            }
            result.avg_sbits = pq / q;
            stats.update(result).catch(function(err) {
              console.error(err);
            });
        }).catch(function(err) {
          console.error(err);
        });
      }).catch(function(err) {
        console.error(err);
      });
    }
  });

}, null, true, 'Europe/Rome');

new CronJob('0 */15 * * * *', function() {
  /* Get prices in USD */
  updateMarketCap();

  /* Update ticketpoolvalue */
  updateTicketpoolvalue();

  /* Update coinsupply */
  updateCoinSupply();

  /* Save market price */
  saveMarketPrice();
}, null, true, 'Europe/Rome');

/* Save network hashrate each 30 mins */
/* Parse PoW-pools */
new CronJob('0 */30 * * * *', function() {
  saveNetworkHashrate();

  parsePoolsHashrate();
}, null, true, 'Europe/Rome');

/* Save network hashrate each 30 mins */
/* Parse PoW-pools */
new CronJob('5 */60 * * * *', function() {
  console.log('Updating exchange rates');
  updateExchangeRates();
}, null, true, 'Europe/Rome');

function getStakepoolsStats() {
   request("https://decred.org/api/?c=gsd", function (error, response, body) {
      if (!error && response.statusCode == 200) {
        try {
          var stakepools = JSON.parse(body);
        } catch(e) {
           console.log('Bad response from https://decred.org/api/?c=gsd');
           console.log(e);
           return;
        }
        if (!stakepools) return;

        var result = [];
        for (let item in stakepools) {
           if (!stakepools[item]['Live'] || stakepools[item]['Live'] == 'N/A') continue;
           if (stakepools[item]['Network'] != 'mainnet') continue;
           result.push(stakepools[item]);
        }
        // sort DESC by live tickets
        result.sort(function(a,b) {return (parseInt(a["Live"],10) < parseInt(b["Live"],10)) ? 1 : ((parseInt(b["Live"],10) < parseInt(a["Live"],10)) ? -1 : 0)});

        fs.writeFile("./uploads/stakepools.json", JSON.stringify(result), function(err) {
          if(err) {
            console.error(err);
            return;
          }
          console.log("Stakepools list updated.");
          return;
        });
      } else {
        console.log('Bad response from https://decred.org/api/?c=gsd');
        console.log('Status: ', response);
        if (error) console.log(error);
      }
      return;
  });
}

function getPrices(next) {
  exec("dcrctl getmininginfo", function(error, stdout, stderr) {
    if (error || stderr) {
      console.error(error, stderr); return next(error, null);
    }
    try {
      var data = JSON.parse(stdout);
    } catch(e) {
      console.log('dcrctl getmininginfo error');
      return next(e,null);
    }
    var result = {
      blocks : data.blocks,
      difficulty: data.difficulty,
      networkhashps: data.networkhashps
    };

    request(POLONIEX, function (error, response, body) {
      if (!error && response.statusCode == 200) {

        try {
          data = JSON.parse(body);
        } catch(e) {
          return next(e,null);
        }

        data = data['BTC_DCR'];
        if (!data) {
          console.log('Poloniex error');
          return next(body,null);
        }
        result.btc_high = data['high24hr'];
        result.btc_low = data['low24hr'];
        result.btc_last = data['last'];
        result.btc_volume = data['baseVolume'];
        result.prev_day = (parseFloat(data['percentChange']) * 100).toFixed(2);

        request(BTCE, function (error, response, body) {
          if (!error && response.statusCode == 200) {

            try {
              data = JSON.parse(body);
            } catch(e) {
              console.log('BTC-E error');
              return next(e,null);
            }

            data = data.btc_usd;
            if (!data) {
              return next(body,null);
            }

            result.usd_price = data.last;

            return next(null, result);
          } else {
            console.error(error); return next(error, null);
          }
        });

      } else {
        console.error(error); return next(error, null);
      }
    });

  });
}

function findNewBlock(height) {
  exec("bash ./parseblocks.sh " + height, function(error, stdout, stderr) {
    if (error || stderr) {
      return;
    }

    var data = JSON.parse(stdout);
    var insert = {
      hash : data.hash,
      height: data.height,
      datetime: data.time,
      voters: data.voters,
      poolsize: data.poolsize,
      sbits: data.sbits,
      difficulty: data.difficulty,
      num_tickets: data.freshstake
    };

    BEST_HEIGHT = data.height;

    Blocks.findOrCreate({where: {hash : insert.hash}, defaults: insert})
      .spread(function(row, created) {
        if (created) {
          console.log('New block was added, height: ' + height);

          getAverageMempoolFees(); // update ticket fees

          parseSStx(data.stx, function(err, yes_votes) {
            if (err) {
              console.error(err);
            }

            row.update({yes_votes : yes_votes}).catch(function(err) {
              console.log(err);
            });

            updateEstimatedTicketPrice(row.hash);

            findNewBlock(height + 1);
          });
        } else {
          console.log('No new blocks found');
        }
      }).catch(function(err) {
        console.log(err);
      });
  });
}

function parseSStx(sstx, next) {
  var yes_votes = 0;
  var counter = 1;
  for (let tx of sstx) {
    exec("bash ./parsesstx.sh " + tx, function(error, stdout, stderr) {
      if (error || stderr) {
        console.error(error)
        return next(error, null);
      }
      //console.log('Parsing SStx transaction ' + counter + ' of ' + sstx.length + ': ' + tx);
      try {
        var data = JSON.parse(stdout);
        // is ticket revoked?
        if (data.vout[1]) {
          data = data.vout[1].scriptPubKey.asm;
        } else {
          data = null;
        }
      } catch(e) {
        return next(e, null);
      }
      if (data) {
        data = data.replace('OP_RETURN ', '')
        if (data.length === 4) {
          if (data === '0100') {
            yes_votes++;
            console.log('Vote is YES');
          } else if (data === '0000') {
            console.log('Vote is NO');
          }
        }
      }
      if (counter >= sstx.length) {
        console.log('Total YES votes: ' + yes_votes);
        return next(null, yes_votes);
      }
      counter++;
    });
  }
}

function getAverageMempoolFees() {
  exec("dcrctl ticketfeeinfo 5 1", function(error, stdout, stderr) {
    try {
      var data = JSON.parse(stdout);
    } catch(e) {
      console.error("Error ticketfeeinfo", e);
      return;
    }

    if (data) {
      Stats.findOne({where : {id : 1}}).then(function(stats) {

        stats.update({fees : data.feeinfomempool.mean, max_fees: data.feeinfomempool.max})
        .then(function(row) {
          if (data['feeinfoblocks']) {
            if (data['feeinfoblocks'][0]) {
              for (let row of data['feeinfoblocks']) {
                Blocks.findOne({where : {'height' : row.height}}).then(function(block) {
                  if (!block) {
                    return;
                  }
                  let update = {
                    min_fee : row.min,
                    avg_fee : row.mean,
                    max_fee : row.max,
                    median_fee : row.median
                  };
                  return block.update(update);
                }).catch(function(err) {
                  console.error(err);
                });
              }
            }
          }
        }).catch(function(err) {
          console.error(err);
        });

      }).catch(function(err) {
        console.error(err);
      });
    }
  });
}

function getStakepoolInfo() {
  exec("dcrctl --wallet getstakeinfo", function(error, stdout, stderr) {
    try {
      var data = JSON.parse(stdout);
    } catch(e) {
      console.error("Error getstakeinfo", e);
      return;
    }

    if (data) {
      var pooledtx = data.allmempooltix;
      data = null;
      Stats.findOne({where : {id : 1}}).then(function(stats) {
       stats.update({pooledtx : pooledtx}).then(function(row) {
         //console.log('Mempool size is ' + pooledtx);
       }).catch(function(err) {
          console.error(err);
        });
      }).catch(function(err) {
        console.error(err);
      });
    }
  });
}

function checkMissedTickets() {
  /* Select blocks count grouped by votes amount*/
  let query = {
    attributes: ['voters', [sequelize.fn('COUNT', sequelize.col('id')), 'blocks']],
    where: {
      voters: {$ne : 0}
    },
    group: ['voters']
  };

  Blocks.findAll(query).then(function(result) {

    Stats.findOne({where : {id : 1}}).then(function(stats) {
      let data = {};
      for (let row of result) {
        row = row.dataValues;
        if (row.voters == 3) {
          data.three_voters = row.blocks;
        } else if (row.voters == 4) {
          data.four_voters = row.blocks;
        } else if (row.voters == 5) {
          data.five_voters = row.blocks;
        }
      }
      stats.update(data);
      return;
    }).catch(function(err) {
      console.log(err); return;
    });

  }).catch(function(err) {
    console.log(err); return;
  });

}

function updateMarketCap() {
  console.log('Updating USD, BTC market price.');
  request(MARKET_CAP, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      try {
        let json = JSON.parse(body);
        json = JSON.stringify({usd_price : json.price_usd, btc_price : json.price_btc});
        fs.writeFile("./uploads/prices.json", json, function(err) {
            if(err) {
                return console.error(err);
            }
            return console.log("USD,BTC market price updated.");
        });

      } catch(e) {
        console.error('updateMarketCap: ', e); return;
      }
    }
  });
}

function saveNetworkHashrate() {
  exec("dcrctl getmininginfo", function(error, stdout, stderr) {
    try {
      var data = JSON.parse(stdout);
    } catch(e) {
      console.error("Error getmininginfo", e);
      return;
    }

    var timestamp = Math.floor(new Date() / 1000);
    Hashrate.create({timestamp : timestamp, networkhashps : data.networkhashps}).then(function(row) {
      console.log('New network hashrate has been saved:', data.networkhashps);
    }).catch(function(err) {
      console.error(err); return;
    })
  });
}

function parsePoolsHashrate() {
    Pools.findAll().then(function(pools) {
      for (let pool of pools) {
        request({url : pool.url, rejectUnauthorized: false}, function (error, response, body) {
          var json = {};
          if (!error && response.statusCode == 200) {
            try {
              json = JSON.parse(body);
            } catch(e) {
              console.error('parsePoolsHashrate: ', e); return;
            }
          }
          var update = {
            hashrate: 0,
            workers: 0
          };
          if (pool.unit == 'hash' && json.decred) {
            update = {
              hashrate: (json.decred.hashrate / 1000 / 1000 / 1000) || 0,
              workers: json.decred.workers || 0
            };
          } else if (pool.unit == 'kilohash' && json.getpoolstatus) {
            update = {
              hashrate: (json.getpoolstatus.data.hashrate / 1000 / 1000) || 0,
              workers: json.getpoolstatus.data.workers || 0
            };
          }

          pool.update(update).then(function(row) {
            console.log('Pool '+row.name+' has been updated.');
          }).catch(function(err) {
            console.error(err); return;
          })
        });
      }
    }).catch(function(err) {
      console.error(err); return;
    })
}

function updateTicketpoolvalue() {
  exec("dcrctl getticketpoolvalue", function(error, stdout, stderr) {
    if (error || stderr) {
      console.error('Update of ticketpoolvalue failed.');
      return;
    }
    try {
      var price = Number(stdout);
      price = parseInt(price, 10);
    } catch(e) {
      console.error("Error getticketpoolvalue", e);
      return;
    }

    if (price == NaN) return;

    Stats.findOne({where : {id : 1}}).then(function(stats) {
      stats.update({ticketpoolvalue : price}).catch(function(err) {
        console.error(err);
      });
    }).catch(function(err) {
      console.error(err);
    });
  });
}

function updateCoinSupply() {
  exec("dcrctl getcoinsupply", function(error, stdout, stderr) {
    try {
      var supply = parseInt(stdout, 10);
    } catch(e) {
      console.error("Error getcoinsupply", e);
      return;
    }

    Stats.findOne({where : {id : 1}}).then(function(stats) {
      stats.update({coinsupply : supply}).catch(function(err) {
        console.error(err);
      });
    }).catch(function(err) {
      console.error(err);
    });
  });
}

function updateEstimatedTicketPrice(hash) {
  exec("dcrctl estimatestakediff", function(error, stdout, stderr) {
    try {
      var data = JSON.parse(stdout);
    } catch(e) {
      console.error("Error estimatestakediff", e);
      return;
    }

    if (data.expected) {

      Stats.findOne({where : {id : 1}}).then(function(stats) {
        var update = {
          est_sbits : data.expected,
          est_sbits_min : data.min,
          est_sbits_max : data.max,
          prev_est_sbits : stats.est_sbits
        };
        return stats.update(update);
      }).catch(function(err) {
        console.error(err);
      });

      Blocks.findOne({where : {hash : hash}}).then(function(row) {
        return row.update({estimated_ticket_price : data.expected});
      }).catch(function(err) {
        console.error(err);
      });
    }

  });
}

function saveMarketPrice() {
  Stats.findOne({where : {id : 1}}).then(function(stats) {
    var data = {
      dcr_btc : stats.btc_last,
      btc_usd : stats.usd_price,
      dcr_usd : (stats.btc_last * stats.usd_price),
      datetime : Math.floor(new Date().getTime() / 1000)
    };

    Prices.create(data).then(function(row) {
      console.log('Saved 15-mins market price');
    }).catch(function(err) {
      console.error(err);
    });

  }).catch(function(err) {
    console.error(err);
  });
}

function getBittrexVolume() {
  request(BITTREX, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var json = {};
      var volume = 0;
      try {
        json = JSON.parse(body);
        volume = json.result[0].BaseVolume.toFixed(2);
      } catch(e) {
        console.error('Bad response from Bittrex. Cannot update bittrex_volume.', e);
        return;
      }

      Stats.findOne({where : {id : 1}}).then(function(stats) {
        return stats;
      })
      .then(function(stats) {
        return stats.update({bittrex_volume : volume});
      })
      .catch(function(err) {
        console.error(err);
      });
    } else {
      console.log('Bad response from bittrex', response);
    }
  });
}

function updateExchangeRates() {
  request(APILAYER + config.currencylayer_key, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var json = {};
      try {
        json = JSON.parse(body);
        if (!json.quotes) throw new Error('Empty quotes');
        json = JSON.stringify(json.quotes);
      } catch(e) {
        console.error('Bad response from apilayer.net', e);
        return;
      }

      fs.writeFile("./uploads/rates.json", json, function(err) {
          if(err) {
              return console.error(err);
          }
          return console.log("Exchange rates updated.");
      });

    } else {
      console.log('Bad response from apilayer.net', response);
    }
  });
}

app.listen(8080, function () {
  console.log('Listening on port 8080!');
});

module.exports = app;

"use strict";

var fs = require("fs");
var jade = require("jade");
var express = require("express");
var router = express.Router();

var config = require("../config/config.json");

var p = require("../config/profiles.json");
var profiles = {};
for (var i=0; i< p.length; i++) {
  profiles[p[i].alt_ticker] = p[i];
}
var strings = require("../config/strings.json");

var Stats = require("../models").Stats;

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

router.get("/", function (req, res) {
  var profile = get_profile(req);
  Stats.findOne({where : {ticker: profile.alt_ticker}}).then(function(stats) {
    if (stats == null) {
      console.error("Site(/):", "Browser called but the stats table is empty");
      return;
    }
    
    stats = stats.dataValues;

    fs.readFile("./config/currencies.json", "utf8", function(err, currencies) {
      if (err) { console.error("Site(/):", err); }
      let data = {
        page:"index",
        s: strings,
        title: strings.main_title,
        base_url: config.base_url,
        
        tickers: Object.keys(profiles),
        profiles: profiles,

        current_profile: profile,
        alt_ticker: profile.alt_ticker,
        converter_name: profile.converter_name,
        stats: stats,
      };

      try { 
        data.currencies = JSON.parse(currencies); 
      } catch (e) {}
      
      res.render("index", data);
    });
  }).catch(function(err) {
    console.error("Site(/):", err);
  });
});

router.get("*", render404);

function render404(req, res){
  let data = {
    page: "404",
    s: strings,
    title: strings.page_not_found,
    base_url: config.base_url,
  };
  res.status(404).render("404.jade", data);
}

module.exports = router;

"use strict";

var fs = require("fs");
var jade = require("jade");
var express = require("express");

var router = express.Router();

var env = process.env.NODE_ENV || "development";
var config = require("../config/config.json")[env];

var p = require("../config/profiles.json");
var profiles = {};
for (var i=0; i< p.length; i++) {
  profiles[p[i].alt_ticker] = p[i];
}
var strings = require("../public/strings/strings.json");

var Stats = require("../models").Stats;

function get_profile(req) {
  if (req.query.c) {
    return req.query.c;
  } else {
    return config.default_profile;
  }
}

router.get("/", function (req, res) {
  console.log(get_profile(req));
  Stats.findOne({where : {ticker: get_profile(req)}}).then(function(stats) {
    if (stats == null) {
      console.error("Site(/):", "Browser called but the stats table is empty");
      return;
    }
    
    stats = stats.dataValues;

    fs.readFile("./config/currencies.json", "utf8", function(err, currencies) {
      if (err) { console.error("Site(/):", err); }
      let data = {
        env : env,
        page:"index",
        s: strings,
        title: strings.main_title,
        base_url: config.base_url,
        
        current_profile: profiles[get_profile(req)].alt_ticker,
        alt_ticker: profiles[get_profile(req)].alt_ticker,
        converter_name: profiles[get_profile(req)].converter_name,
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

router.get("*", function(req, res){
  let data = {
    env : env,
    page:"404",
    s: strings,
    title: strings.page_not_found,
    base_url: config.base_url,
  };
  res.status(404).render("404.jade", data);
});

module.exports = router;

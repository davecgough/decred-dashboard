"use strict";

var fs = require("fs");
var jade = require("jade");
var express = require("express");

var router = express.Router();

var env = process.env.NODE_ENV || "development";
var config = require("../config/config.json")[env];

var profiles = {};
for (var i=0; i< config.load_profiles.length; i++) {
  var x = config.load_profiles[i];  
  var p = require("../config/" + x);
  profiles[p.alt_ticker] = p;
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
  Stats.findOne({where : {ticker: get_profile(req)}}).then(function(stats) {
    if (stats == null) {
      console.error("SITE(/):", "Browser called but the stats table is empty");
      return;
    }
    
    stats = stats.dataValues;

    fs.readFile("./uploads/currencies.json", "utf8", function(err, currencies) {
      if (err) { console.error("SITE(/):", err); }
      let data = {
        env : env,
        page:"index",
        title: strings.main_title,
        desc: strings.main_desc,
        og_title: strings.og_title,
        base_url: config.base_url,
        
        logo:"logo.png",
        favicon:"favicon.png",

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
    console.error("SITE(/):", err);
  });
});

router.get("*", function(req, res){
  let data = {
    env : env,
    page:"404",
    title: strings.page_not_found,
    desc: strings.main_desc,
    og_title: strings.og_title,
    base_url: config.base_url,
  };
  res.status(404).render("404.jade", data);
});

module.exports = router;

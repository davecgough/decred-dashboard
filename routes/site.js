"use strict";

var fs = require('fs');
var jade = require('jade');
var express = require('express');

var router = express.Router();

var strings = require('../public/strings/seo.json');
var env = process.env.NODE_ENV || 'development';
var currencies = require('../uploads/currencies.json');

var Stats = require('../models').Stats;

router.get('/', function (req, res) {
  Stats.findOne({where : {id : 1}}).then(function(stats) {
    if (stats == null) {
      console.error("Browser called but the stats table is empty");
      return;
    }
    
    stats = stats.dataValues;

    let data = {
      env : env,
      page: 'index',
      title: strings.main_title,
      desc: strings.main_desc,
      stats: stats
    };
    
    res.render('index', data);
  }).catch(function(err) {
    console.error(err);
  });
});

router.get('/converter', function(req, res) {
  fs.readFile('./uploads/currencies.json', 'utf8', function(err, currencies) {
    if (err) { console.error(err); }
    let data = {
      env : env,
      page: 'converter',
      title: strings.converter_title,
      desc: strings.converter_desc
    };
    try { data.currencies = JSON.parse(currencies); } catch (e) {}
    res.render('converter', data);
  });
});

module.exports = router;

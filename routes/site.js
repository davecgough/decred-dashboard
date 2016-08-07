"use strict";

var fs = require('fs');
var jade = require('jade');
var express = require('express');
var validator = require("email-validator");
var nodemailer = require('nodemailer');

var router = express.Router();

var strings = require('../public/strings/seo.json');
var env = process.env.NODE_ENV || 'development';
var config = require('../config/config.json')[env];
var currencies = require('../uploads/currencies.json');

var Blocks = require('../models').Blocks;
var Stats = require('../models').Stats;

router.get('/', function (req, res) {
  Stats.findOne({where : {id : 1}}).then(function(stats) {

    Blocks.findOne({order: 'height DESC'}).then(function(block) {
      stats = stats.dataValues;
      stats.poolsize = block.poolsize;
      stats.sbits = block.sbits;

      fs.readFile('./uploads/stakepools.json', 'utf8', function(err, stakepools) {
        if (err) { console.error(err); }
        let data = {
          env : env,
          page: 'index',
          title: strings.main_title,
          desc: strings.main_desc,
          stats: stats
        };
        if (stakepools) { try { data.stakepools = JSON.parse(stakepools); } catch (e) {} }
          res.render('index', data);
      });
    });
  }).catch(function(err) {
    console.error(err);
  });
});

router.get('/pow', function(req, res) {
  let data = {
    env : env,
    page: 'pow',
    title: strings.pow_title,
    desc: strings.pow_desc
  };
  res.render('pow', data);
});

router.get('/map', function(req, res) {
  let data = {
    env : env,
    page: 'map',
    title: strings.map_title,
    desc: strings.map_desc
  };
  res.render('map', data);
});

router.get('/app', function(req, res) {
  let data = {
    env : env,
    page: 'app',
    title: strings.app_title,
    desc: strings.app_desc
  };
  res.render('app', data);
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

router.get('/subsidy', function(req, res) {
  let response = {
    env : env,
    page: 'subsidy',
    title: strings.subsidy_title,
    desc: strings.subsidy_desc
  };

  var total = 840000 * 2;
  var data = [];
  for (let i = 0; i <= 400; i++) {
    var reward = getEstimatedBlockReward(i, 31.19582664);
    if(i > 0) { total += 6144 * reward; }
    var row = {
      block: (i * 6144),
      date: (1454954400 + i * 6144 * 295),
      block_reward : reward,
      pow_reward : (0.6 * reward),
      pos_reward : (0.06 * reward),
      dev_reward : (0.1 * reward),
      total : total
    };
    data.push(row);
  }
  response.result = data;
  res.render('subsidy', response);
});

function getEstimatedBlockReward(cycles, reward) {
  if (cycles) {
    reward = reward * 100/101;
    return getEstimatedBlockReward(cycles - 1, reward);
  } else {
    return reward;
  }
}

module.exports = router;

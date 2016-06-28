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

module.exports = router;

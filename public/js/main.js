$(function() {

var countdownDiff = 1493139600 - Math.floor(new Date().getTime() / 1000);

/* Lion Banner Start */
  function lsTest(){
      var test = 'test';
      try {
          localStorage.setItem(test, test);
          localStorage.removeItem(test);
          return true;
      } catch(e) {
          return false;
      }
  }

  if(lsTest() === true) {
    if (localStorage.getItem("already_the_lion") != "true") {
      $('#stakepool_block').show();
    }
  }

  $('#meet_the_stakepool').on('click', function(e) {
    e.preventDefault();
    if(lsTest() === true) {
      localStorage.setItem("already_the_lion", "true");
      $('#stakepool_block').hide();
    }
  });
/* Lion Banner End */

  var lastBlockInterval;
  updateStats(true);
  setInterval(updateStats, 15000);
  updateFeesInfo();
  setInterval(updateFeesInfo, 15000);

  function updateStats(isStartup) {

    var nonce = (new Date()).getTime();
    $.ajax({
      url : '/api/v1/get_stats?'+nonce,
      type: 'GET',
      success: function(response) {

        if (!response.error) {

          /* If there is a new block, then update ticket fees info */
          var oldBlockHeight = parseInt($('.fees-table tr:first').data('best'), 10);
          if (response.blocks > oldBlockHeight) {
            updateFeesInfo();
          }

          var usd_last = (response.btc_last * response.usd_price).toString().substr(0,4);
          if (response.prev_day > 0) {
            $('span.stats-lastprice')
              .html('$' + usd_last + '<span class="up">▴</span>');
          } else {
            $('span.stats-lastprice')
              .html('$' + usd_last + '<span class="down">▾</span>');
          }
          $('span.price-change.percent').text(response.prev_day + "% change");
          $('span.price-change.volume').text("Volume " + parseFloat(response.btc_volume).toFixed(2) + " BTC");

          var btc_low = (response.btc_low).toString().substr(0,8);
          var usd_low = (response.btc_low * response.usd_price).toString().substr(0,4);
          $('span.stats-daylow').text('$' + usd_low);
          $('span.btc-low').text(btc_low + ' BTC');

          var btc_high = (response.btc_high).toString().substr(0,8);
          var usd_high= (response.btc_high* response.usd_price).toString().substr(0,4);
          $('span.stats-dayhigh').text('$' + usd_high);
          $('span.btc-high').text(btc_high + ' BTC');

          if (response.prev_day > 0) {
            $('span.stats-btc')
              .html(response.btc_last.toString().substr(0,8) + '<span class="up">▴</span>');
          } else {
            $('span.stats-btc')
              .html(response.btc_last.toString().substr(0,8) + '<span class="down">▾</span>');
          }

          $('span.stats-btc-usd').text('$' + response.usd_price);

          var hashrate = (response.networkhashps / 1000 / 1000 / 1000 / 1000).toString().substr(0,5);
          $('span.stats-hashrate').html(hashrate);
          $('span.stats-blocks').html(numberFormat(response.blocks));
          $('span.stats-difficulty').html(numberFormat(Math.floor(response.difficulty)));
          $('span.stats-time').html('0' + response.average_minutes + ':' + response.average_seconds);
          clearInterval(lastBlockInterval);
          var lastTimeBlock = $('span.stats-lastblock-time');
          lastBlockInterval = setInterval(function() {
            var time = 0;
            var diff = Math.floor(new Date().getTime() /  1000) - Math.floor(response.last_block_datetime);

            var minutes = Math.floor(Math.floor(diff) / 60);
            minutes = minutes < 10 ? '0' + minutes : minutes;
            var seconds = (Math.round(diff) % 60);
            seconds = seconds < 10 ? '0' + seconds : seconds;

        		time = minutes + ' min ' + seconds + ' sec';
            lastTimeBlock.html(time + ' ago');
          }, 1000);

          var ticket_price = response.sbits.toString().substr(0,5);
          /* 2.00000001 -> 2.01
           * 2.09999999 -> 2.10
           */
          ticket_price = parseFloat(ticket_price);
          if (response.sbits > ticket_price) {
            ticket_price = Math.round((ticket_price + 0.01) * 100) / 100;
          }

          //$('span.real-pos-price').attr('title', response.sbits + ' DCR');
          $('span.stats-ticketprice').html(ticket_price + ' DCR');
          $('span.stats-poolsize').html(numberFormat(response.poolsize));
          $('span.stats-mempool').html(numberFormat(response.pooledtx));

          /*
          var avg_fee = response.fees ? response.fees.toFixed(4) : 0;
          var max_fee = response.max_fees ? response.max_fees.toFixed(4) : 0;
          $('span.stats-fees').html(avg_fee + ' <span class="hidden-xs">DCR</span>');
          */

          var est_pos_blocks = 144 - (response.blocks % 144);
          var est_pos_time = secondsToTime(est_pos_blocks * response.average_time);

          $('.est-pos-time').html('in '+est_pos_time.hours+' hours '+est_pos_time.minutes+' minutes');
          $('.est-pos-blocks').html('<b>' + est_pos_blocks + '</b> blocks left');
          if (response.est_sbits <= response.prev_est_sbits) {
            $('.est-pos-price').html(response.est_sbits.toString().substr(0,5) + ' DCR');
          } else {
            $('.est-pos-price').html(response.est_sbits.toString().substr(0,5) + ' DCR');
          }
          $('.min-est-pos').html(response.est_sbits_min.toString().substr(0,5) + ' DCR');
          $('.max-est-pos').html(response.est_sbits_max.toString().substr(0,5) + ' DCR');

          var block_reward = getEstimatedBlockReward(Math.ceil(response.blocks / 6144) - 1, response.reward);
          $('.block-reward').html(block_reward.toString().substr(0,5) + ' DCR');
          $('.pow-block-reward').html('<span class="hidden-xs"><b>PoW-reward</b> </span><span class="visible-xs-inline"><b>PoW</b> </span>' + (block_reward * 0.6).toString().substr(0,6) + ' DCR');
          $('.pos-block-reward').html('<span><b>PoS vote</span></b> ' + (block_reward * 0.3 / 5).toString().substr(0,6) + ' DCR');
          $('.dev-block-reward').html('<span class="hidden-xs"><b>Dev subsidy</b> </span><span class="visible-xs-inline"><b>Devs</b> </span>' + (block_reward * 0.1).toString().substr(0,6) + ' DCR');

          var next_block_subsidy = getEstimatedBlockReward(Math.ceil(response.blocks / 6144), response.reward);
          $('.est-block-reward').html(next_block_subsidy.toString().substr(0,5) + ' DCR');

          var est_subsidy_blocks = 6144 - (response.blocks % 6144);
          var est_subsidy_time = secondsToTime(est_subsidy_blocks * response.average_time);
          if (est_subsidy_time.days) {
            $('.est-reward-time').html('in '+est_subsidy_time.days+' days '+est_subsidy_time.hours+' hours');
          } else {
            $('.est-reward-time').html('in '+est_subsidy_time.hours+' hours '+est_subsidy_time.minutes+' minutes');
          }
          $('.est-reward-blocks').html('<b>' + est_subsidy_blocks + '</b> blocks left');

          /***** Hints blocks *****/

          /* PoS tickets */

          // Average ticket price in the pool = amount of locked coins divide by number of tickets in the pool
          var avg_price_in_pool = Math.round((response.ticketpoolvalue / response.poolsize) * 100) / 100;

          var hint_title = '', hint_content = '';
          var vote_reward = parseFloat(block_reward * 0.3 / 5) - 0.01;
          hint_title = 'Estimated return on investment';
          hint_content = 'Your estimated ROI is <b>+' + (100 * vote_reward / response.sbits).toFixed(2) + '%</b> if you will buy ticket now with a 0.01 DCR fee.';

          $('.avg-price').html(response.avg_sbits.toString().substr(0,4) + ' DCR');
          $('.hint-title').html(hint_title);
          $('.hint-content').html(hint_content);

          /* Mempool fees */
          // $('b.avg-fee').html(avg_fee + ' DCR');
          // $('b.max-fee').html(max_fee + ' DCR');

          /* Total locked DCR in PoS */
          $('.poolvalue').html(numberFormat(response.ticketpoolvalue) + ' DCR');

          var coinsupply = response.coinsupply / 100000000;
          var poolvalue_percent = ((response.ticketpoolvalue / coinsupply) * 100).toString().substr(0,5);
          $('.poolvalue-percent').html(poolvalue_percent + ' %');
          $('.avg-price-in-pos-pool').html(avg_price_in_pool + ' DCR');

           /***** Hints blocks end *****/

          /* Draw voters chart on page load */
          if (isStartup) {
            if (response.voting) {
              if (response.voting.agendas) {
                for (var i = 0; i < response.voting.agendas.length; i++) {
                  drawVotingChart(response.voting.agendas[i], response.voting);
                }
              }
            }
          }

          /* Draw supply chart on page load */
          if (isStartup) {
            var mined = coinsupply - 1680000;
            var supply = {
              premine: 1680000,
              pow: mined * 0.6,
              pos: mined * 0.3,
              devs: mined * 0.1
            };
            drawSupplyChart(supply);
            var supply_total = Math.floor(coinsupply);
            var percent_mined = (supply_total / 21000000 * 100).toString().substr(0,4);
            $('.mined_coins').html(numberFormat(supply_total));
            $('.percent_mined').html(percent_mined + '% ');
            $('.supply-progress .progress .progress-bar')
              .css('width', percent_mined + "%")
              .attr('aria-valuenow', percent_mined);
          }
        }
      }
    });
  };
});


$(function () {

    $('.glyphicon-question-sign').tooltip();
    $('span.fa-trophy').tooltip();
    var nonce = (new Date()).getTime();

    $('.pos-group .btn-chart').on('click', function(e) {
      e.preventDefault();
      var $this = $(this);
      var time = $this.data('period');
      var chart = $this.data('chart');

      var nonce = (new Date()).getTime();

      $this.parent().find('button').each(function(item) { $(this).removeClass('active'); });
      $this.addClass('active');

      $.ajax({
        url: '/api/v1/pos?data='+chart+'&time='+time+'&nonce='+nonce,
        type: 'GET',
        dataType: "json",
        success: function (data) {
          if (chart == 'sbits') {
            drawSbits(data, time);
          }
        }
      });
    });

    $('.price-group .btn-chart').on('click', function(e) {
      e.preventDefault();
      var $this = $(this);
      var ticker = $this.data('ticker');
      var time = $this.data('time');
      var chart = $this.data('chart');

      /* Change chart title only if we change currency */
      if (ticker) {
        $('.price-chart-title').text('Decred Price, ' + ticker.toUpperCase());
      } else {
        ticker = $('.price-group .price-ticker.active').data('ticker');
      }
      if (!time) {
        time = $('.price-group .price-time.active').data('time');
      }
      $this.parent().find('button').each(function(item) { $(this).removeClass('active'); });
      $this.addClass('active');
      updatePricesChart(ticker, time);
    });

    $.ajax({
      url: '/api/v1/pos?time=30&nonce='+nonce,
      type: 'GET',
      dataType: "json",
      success: function (data) {
        drawSbits(data, 30);
      }
    });

    updatePricesChart('usd', 30);
});

function updatePricesChart(ticker, time) {
  if (ticker != 'usd' && ticker != 'btc') {
    ticker = 'usd';
  }
  if (!time) {
    time = 365;
  }
  if (time < 1) { time = 1; }
  if (time > 7) {
    $.ajax({
      url: '/api/v1/prices',
      type: 'GET',
      data: {ticker : ticker, time : time},
      dataType: "json",
      success: function (data) {
        if (!data.error) {
          drawPrice(data, ticker);
        }
      }
    });
  } else {
    $.ajax({
      url: '/api/v1/day_price',
      type: 'GET',
      data: {ticker : ticker, time : time},
      dataType: "json",
      success: function (data) {
        if (!data.error) {
          drawPrice(data, ticker);
        }
      }
    });
  }
}

function updateFeesInfo() {
  $.ajax({
    url: '/api/v1/fees',
    type: 'GET',
    data: {},
    dataType: "json",
    success: function (data) {
      if (!data.error) {
        fillFeesTable(data);
      }
    }
  });
}

function fillFeesTable(data) {
  if(Object.prototype.toString.call( data ) != '[object Array]') {
    return;
  }
  var html = "";
  for (var i = 0; i < data.length; i++) {
    if (i > 9) continue; // let's show only last 10 blocks
    var block = data[i];

    /* Update Average Fee in the Main Dashboard */
    if (i == 0 && block.avg_fee >= 0) {
      var avg_fee = block.avg_fee ? parseFloat(block.avg_fee).toFixed(4) : 0;
      $('span.stats-fees').html(avg_fee + ' <span class="hidden-xs">DCR</span>');
    }

    html += '<tr '+(i == 0 ? 'data-best="'+block.height+'"' : '')+'>';
    html += '<td>'+numberFormat(block.height)+'</td>';
    html += '<td class="hidden-xs">'+moment(block.datetime * 1000).fromNow()+'</td>';
    html += '<td class="hidden-xs">'+block.num_tickets+'</td>';
    if (block.min_fee > 0) block.min_fee = parseFloat(block.min_fee).toFixed(5)
    html += '<td class="hidden-xs">'+block.min_fee+'</td>';
    if (block.avg_fee > 0) block.avg_fee = parseFloat(block.avg_fee).toFixed(5)
    html += '<td>'+block.avg_fee+'</td>';
    if (block.max_fee > 0) block.max_fee = parseFloat(block.max_fee).toFixed(5)
    html += '<td>'+block.max_fee+'</td>';

    html += '</tr>';
  }
  $('.blocks-fee-info').html(html);
}

function getEstimatedBlockReward(cycles, reward) {
  if (cycles) {
    reward = reward * 100/101;
    return getEstimatedBlockReward(cycles - 1, reward);
  } else {
    return reward;
  }
}

function numberFormat(number) {
    return number.toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
}

function secondsToTime(secs) {
  var hours = Math.floor(secs / (60 * 60));

  var divisor_for_minutes = secs % (60 * 60);
  var minutes = Math.floor(divisor_for_minutes / 60);
  if (minutes < 10) {
    minutes = "0" + minutes.toString();
  }

  var days = 0;

  if (hours >= 24) {
    days = parseInt(hours / 24, 10);
    hours = hours - days * 24;
    minutes = 0;
  }

  return {"days" : days, "hours": hours, "minutes": minutes};
}

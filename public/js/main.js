var profile = "DCR";

$(function() {

  updateStats(true);
  setInterval(updateStats, 10000);

  function updateStats(isStartup) {

    var nonce = (new Date()).getTime();
    $.ajax({
      url : '/api/v1/get_stats?c='+profile+'&'+nonce,
      type: 'GET',
      success: function(response) {

        if (!response.error) {

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
          var usd_high = (response.btc_high * response.usd_price).toString().substr(0,4);
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
        }
      }
    });
  };
});


$(function () {

    var nonce = (new Date()).getTime();

    $('.price-group .btn-chart').on('click', function(e) {
      e.preventDefault();
      var $this = $(this);
      var ticker = $this.data('ticker');
      var time = $this.data('time');
      var chart = $this.data('chart');

      /* Change chart title only if we change currency */
      if (ticker) {
        var old_title = $('.price-chart-title').text();
        old_title = old_title.substr(0, old_title.indexOf(','));
        $('.price-chart-title').text(old_title + ', ' + ticker.toUpperCase());
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
      url: '/api/v1/prices?c='+profile,
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
      url: '/api/v1/day_price?c='+profile,
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

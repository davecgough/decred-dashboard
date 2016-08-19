$(function() {

  var nonce = (new Date()).getTime();
  $.ajax({
    url : '/api/v1/get_stats?nonce='+nonce,
    type: 'GET',
    success: function(response) {
      if (!response.blocks) return;

      var rows = $('td.height');
      var height = 0;
      var nextHeight = 0;
      for (var i = 0; i < rows.length - 1; i++) {
        height = parseInt($(rows[i]).text());
        nextHeight = parseInt($(rows[i + 1]).text());
        if (response.blocks > height && response.blocks <= nextHeight) {
          $(rows[i]).parent().css('background', '#ffe99b');
          return;
        }
      }
    }
  });

});

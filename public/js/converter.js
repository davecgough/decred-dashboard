$(function() {

var altcoinAmount = $('#altcoinAmount');
var result = $('#result');
var convertTo = $('#convertTo');

function convert(from) {
  var data = {
    alt : altcoinAmount.val(),
    pair: result.val(),
    from: from,
    to: convertTo.val()
  };
  $.ajax({
    url : '/api/v1/convert',
    type: 'GET',
    data: data,
    success: function(response) {
      altcoinAmount.val(response.alt);
      result.val(response.result);
    }
  });
}

result.on('keyup', function() {
  convert('pair');
});

altcoinAmount.on('keyup', function() {
  convert('alt');
});

convertTo.on('change', function() {
  convert('alt');
});

convert('alt');

});

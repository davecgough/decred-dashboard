$(function() {

var decredAmount = $('#decredAmount');
var result = $('#result');
var convertTo = $('#convertTo');

function convert(from) {
  var data = {
    dcr : decredAmount.val(),
    pair: result.val(),
    from: from,
    to: convertTo.val()
  };
  $.ajax({
    url : '/api/v1/convert',
    type: 'GET',
    data: data,
    success: function(response) {
      decredAmount.val(response.dcr);
      result.val(response.result);
    }
  });
}

result.on('keyup', function() {
  convert('pair');
});

decredAmount.on('keyup', function() {
  convert('dcr');
});

convertTo.on('change', function() {
  convert('dcr');
});

convert('dcr');

});

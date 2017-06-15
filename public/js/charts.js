function drawPrice(data, ticker) {
  var valueDecimals = ticker == 'usd' ? 2 : 8;

  $('#price-chart').highcharts({
    chart: {backgroundColor: "#C2D3EA"},
    tooltip: {backgroundColor: "#e2e2e2", borderColor: '#fff', style: {"color": "#2f2f2f"}},
    title: {text: ''},
    credits: {enabled: false},
    exporting: {enabled: false},
    navigator: {enabled: false},
    legend: {enabled: false},
    xAxis: {
        type: 'datetime',
        gridLineWidth: 1,
        gridLineColor: '#fff',
        labels: {style: {color: '#333', fill: '#333'}}
    },
    yAxis: {
        title: {text: ''},
        gridLineWidth: 1,
        gridLineColor: '#fff',
        labels: {style: {color: '#333', fill: '#333'}}
    },
    series: [{
      name: 'Price',
      data: data,
      type: 'spline',
      color: '#3c4ba6',
      lineWidth: 2,
      tooltip: {valueDecimals: valueDecimals},
      marker: {enabled: false},
      states: {hover: {lineWidth: 2}}
    }]
  });

}

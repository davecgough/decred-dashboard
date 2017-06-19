function drawPrice(data, ticker) {
  var valueDecimals = ticker == 'usd' ? 2 : 8;

  $('#price-chart').highcharts({
    chart: {
      backgroundColor: "#FFFFFF",
      borderColor: "#ccc",
      borderWidth: 1
    },
    tooltip: {backgroundColor: "#e2e2e2", bordborderColor: '#fff', style: {"color": "#2f2f2f"}},
    title: {text: ''},
    credits: {enabled: false},
    exporting: {enabled: false},
    navigator: {enabled: false},
    legend: {enabled: false},
    xAxis: {
        type: 'datetime',
        gridLineWidth: 1,
        gridLineColor: '#f3f3f3',
        lineColor: '#d8d8d8',
        lineWidth: 2,
        labels: {style: {color: '#333', fill: '#333'}}
    },
    yAxis: {
        title: {text: ''},
        gridLineWidth: 1,
        gridLineColor: '#f3f3f3',
        lineColor: '#d8d8d8',
        lineWidth: 2,
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

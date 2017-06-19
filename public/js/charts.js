function drawPrice(data, ticker) {
  var valueDecimals = ticker == 'usd' ? 2 : 8;

  $('#price-chart').highcharts({
    chart: {
      backgroundColor: "#FFFFFF",
      borderColor: "#ccc",
      borderWidth: 1,
      zoomType: "x"
    },
    tooltip: {
      // backgroundColor: "#e2e2e2",
      // bordborderColor: '#fff',
      shadow: 0,
      borderWidth: 0,
      backgroundColor: "#455673",
      style: {"color": "#fff"}

    },
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
    plotOptions: {
        areaspline: {
            fillOpacity: 0.1
        }
    },
    series: [{
      name: 'Price',
      data: data,
      type: 'areaspline',
      color: '#56CDF6',
      lineWidth: 2,
      tooltip: {valueDecimals: valueDecimals},
      marker: {enabled: false},
      states: {hover: {lineWidth: 2}}
    }]
  });

}

function drawPrice(data, ticker) {
  var valueDecimals = ticker == 'usd' ? 2 : 8;

  $('#price-chart').highcharts({
    chart: {backgroundColor: null},
    tooltip: {backgroundColor: "#242424", borderColor: '#242424', style: {"color": "#fff"}},
    title: {text: ''},
    credits: {enabled: false},
    exporting: {enabled: false},
    navigator: {enabled: false},
    legend: {enabled: false},
    xAxis: {
        type: 'datetime',
        gridLineWidth: 1,
        gridLineColor: '#fff',
        labels: {style: {color: '#9aa2a9', fill: '#9aa2a9'}}
    },
    yAxis: {
        title: {text: ''},
        gridLineWidth: 1,
        gridLineColor: '#fff',
        labels: {style: {color: '#9aa2a9', fill: '#9aa2a9'}}
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

function drawSbits(data) {
  $('#pos-sbits').highcharts({
    chart: {backgroundColor: null},
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
        labels: {style: {color: '#9aa2a9', fill: '#9aa2a9'}}
    },
    yAxis: {
        title: {text: ''},
        gridLineWidth: 1,
        gridLineColor: '#fff',
        labels: {style: {color: '#9aa2a9', fill: '#9aa2a9'}}
    },
    series: [{
                name: 'Price',
                data: data,
                type: 'spline',
                color: '#ac2334',
                lineWidth: 2,
                tooltip: {valueDecimals: 2},
                marker: {enabled: true},
                states: {hover: {lineWidth: 2}}
            }]
  });
}

function drawPow(data, chart, title) {
  $('#pow-'+chart).highcharts({
    chart: {
        zoomType: 'x'
    },
    credits: {
          enabled: false
    },
    exporting: {
          enabled: false
    },
    title: {
        text: title
    },
    xAxis: {
        type: 'datetime'
    },
    legend: {
        enabled: false
    },
    plotOptions: {
        area: {
            fillColor: {
                linearGradient: {
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 1
                },
                stops: [
                    [0, '#FFD285'],
                    [1, '#FF733F']
                ]
            },
            marker: {
                radius: 2
            },
            lineWidth: 1,
            color: '#FFD285',
            states: {
                hover: {
                    lineWidth: 1
                }
            },
            threshold: null
        }
    },
    series: [{type: 'area', data: data}]
});
}

function drawHashrate(data) {
    $(function () {

    $(document).ready(function () {
        // Build the chart
        $('#hashrate-distribution').highcharts({
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                type: 'pie'
            },
            credits: {
                  enabled: false
            },
            exporting: {
                  enabled: false
            },
            title: {
                text: 'Network Hashrate Distribution, Ghash/s'
            },
            subtitle: {
                text: "Total Network Hashrate: " + data[0].network + " Ghash/s"
            },
            tooltip: {
                pointFormat: '<b>{point.y} Ghash/s</b>'
            },
            plotOptions: {
                pie: {
                    allowPointSelect: false,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                    },
                    showInLegend: false
                }
            },
            series: [{
                name: 'Hashrate',
                colorByPoint: true,
                data: data
            }]
        });
    });
});
}

function drawVotersChart(data, missed, total) {
    $(function () {

    $(document).ready(function () {

        var percent_missed = (missed / total * 100).toString().substr(0,4) + '%';

        // Build the chart
        $('#voters').highcharts({
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                type: 'pie'
            },
            credits: {
                  enabled: false
            },
            exporting: {
                  enabled: false
            },
            title: {
                text: 'Voters per block'
            },
            subtitle: {
                text: "<b>"+percent_missed+"</b> tickets didn't cast a vote ("+missed+" of "+total+")"
            },
            tooltip: {
                pointFormat: '<b>{point.y} blocks</b>'
            },
            plotOptions: {
                pie: {
                    allowPointSelect: false,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                    },
                    showInLegend: false
                }
            },
            series: [{
                name: 'Votes',
                colorByPoint: true,
                data: data
            }]
        });
    });
});
}

function drawSupplyChart(data) {
$(function () {
  $(document).ready(function () {
    var total = Math.floor(1680000 + data.pow + data.pos + data.devs);
    var percent_mined = (total / 21000000 * 100).toString().substr(0,4) + '%';

    $('#supply').highcharts({
        chart: {
            backgroundColor: "#f2f2f2",
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotBorderColor: '#000000',
            plotShadow: false,
            type: 'pie'
        },
        credits: {enabled: false},
        exporting: {enabled: false},
        title: {text: ''},
        tooltip: {pointFormat: '<b>{point.y} DCR</b>'},
        plotOptions: {
            pie: {
                allowPointSelect: false,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    color: "#9d9d9d",
                    format: '<b>{point.name}</b>: <span style="color: #333; font-size: 14px;">{point.percentage:.1f} %</span>',
                    style: {textShadow: false}
                },
                borderColor: "#2e3245",
                showInLegend: false
            }
        },
        series: [{
            name: 'Votes',
            colorByPoint: true,
            data: [{
                name: 'Dev Premine',
                y: 840000,
                color: '#ddc38c'
            }, {
                name: 'Airdrop',
                y: 840000,
                color: '#c6a55e'
            }, {
                name: 'PoW-mined',
                y: Math.floor(data.pow),
                color: '#3c4ba6'
            }, {
                name: 'PoS-mined',
                y: Math.floor(data.pos),
                color: '#8c93c0'
            }, {
                name: 'Dev subsidy',
                y: Math.floor(data.devs),
                color: '#b8ada3'
            }]
        }]
      });
    });
});
}

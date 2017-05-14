function drawPrice(data, ticker) {
  var valueDecimals = ticker == 'usd' ? 2 : 8;

  $('#price-chart').highcharts({
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
      color: '#3c4ba6',
      lineWidth: 2,
      tooltip: {valueDecimals: valueDecimals},
      marker: {enabled: false},
      states: {hover: {lineWidth: 2}}
    }]
  });

}

function drawSbits(data, time) {
  var markerStatus = time > 30 ? false : true;
  $('#pos-sbits').highcharts({
    chart: {backgroundColor: null},
    tooltip: {backgroundColor: "#e2e2e2", borderColor: '#fff', style: {"color": "#2f2f2f"}},
    title: {text: ''},
    credits: {enabled: false},
    exporting: {enabled: false},
    navigator: {enabled: false},
    legend: {enabled: true},
    xAxis: {
        type: 'datetime',
        gridLineWidth: 1,
        gridLineColor: '#fff',
        labels: {style: {color: '#9aa2a9', fill: '#9aa2a9'}}
    },
    yAxis: [{
        title: {text: ''},
        gridLineWidth: 1,
        gridLineColor: '#fff',
        labels: {style: {color: '#9aa2a9', fill: '#9aa2a9'}}
    },{
        title: {text: ''},
        gridLineWidth: 1,
        gridLineColor: '#fff',
        labels: {style: {color: '#9aa2a9', fill: '#9aa2a9'}},
        opposite: true
    }],
    series: [
      {
        yAxis: 1,
        name: 'Number of Tickets',
        data: data.tickets,
        type: 'column',
        color: '#e2d2ae',
        lineWidth: 20,
        tooltip: {valueDecimals: 0},
        marker: {enabled: markerStatus},
        states: {hover: {lineWidth: 2}}
      },
      {
        yAxis: 0,
        name: 'Price',
        data: data.sbits,
        type: 'spline',
        color: '#3c4ba6',
        lineWidth: 2,
        tooltip: {valueDecimals: 2},
        marker: {enabled: markerStatus},
        states: {hover: {lineWidth: 2}}
      }]
  });
}

function drawPow(data, chart, title) {
  var valueDecimals = 2;
  var name = 'Thash/s';
  if (chart == 'difficulty') { valueDecimals = 0; var name = 'Difficulty'; }
  $('#pow-'+chart).highcharts({
    chart: {backgroundColor: null},
    credits: {enabled: false},
    exporting: {enabled: false},
    navigator: {enabled: false},
    legend: {enabled: false},
    title: {text: ""},
    xAxis: {type: 'datetime'},
    yAxis: {title: ''},
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
                    [0, '#8c93c0'],
                    [1, '#4a58ad']
                ]
            },
            marker: {
                radius: 2
            },
            lineWidth: 0,
            color: '#8c93c0',
            states: {
                hover: {
                    lineWidth: 1
                }
            },
            threshold: null
        }
    },
    series: [{type: 'area', data: data, name : name, tooltip: {valueDecimals: valueDecimals}}]
});
}

function drawHashrate(data) {
    $(function () {

    $(document).ready(function () {
        // Build the chart
        $('#hashrate-distribution').highcharts({
            chart: {
                backgroundColor: null,
                borderWidth: null,
                shadow: false,
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

function drawVotingChart(data, info) {
    $(function () {

    $(document).ready(function () {
        var percent_mined = (((info.currentheight - info.startheight) / 8096) * 100).toFixed(2);
        var yes_ratio = (data.choices[2].count / (data.choices[2].count + data.choices[1].count) * 100).toFixed(2);

        $('.percent_' + data.id).text(yes_ratio + '%');
        $('.passed_' + data.id).text(info.currentheight - info.startheight);

        $('.'+data.id+'-progress .progress .progress-bar')
          .css('width', percent_mined + "%")
          .attr('aria-valuenow', percent_mined);

        // Build the chart
        $('#' + data.id).highcharts({
            chart: {
                backgroundColor: "#f2f2f2",
                plotbackgroundColor: null,
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
                text: ''
            },
            tooltip: {
                pointFormat: '<b>{point.y} votes</b>'
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
                data: [{
                    name: 'Abstain',
                    y: data.choices[0].count,
                    color: '#ddc38c'
                }, {
                    name: 'Yes',
                    y: data.choices[2].count,
                    color: '#3c4ba6'
                }, {
                    name: 'No',
                    y: data.choices[1].count,
                    color: '#8c93c0'
                }]
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

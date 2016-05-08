// Copyright 2014 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Draw a table.
function drawTable(seriesTitles, titleTypes, data, elementId, numPages, sortIndex) {
  var dataTable = new google.visualization.DataTable();
  for (var i = 0; i < seriesTitles.length; i++) {
    dataTable.addColumn(titleTypes[i], seriesTitles[i]);
  }
  dataTable.addRows(data);
  if (!(elementId in window.charts)) {
    window.charts[elementId] =
        new google.visualization.Table(document.getElementById(elementId));
  }

  var cssClassNames = {
    'headerRow': 'hearder-row',
    'tableRow': 'table-row',
    'oddTableRow': 'table-row'
  };
  var opts = {
    alternatingRowStyle: true,
    page: 'enable',
    pageSize: numPages,
    allowHtml: true,
    cssClassNames: cssClassNames,
    width: '100%',
    height: '100%'
  };
  if(numPages <= 0) {
    opts.page = 'disable';
  }
  window.charts[elementId].draw(dataTable, opts);
}

// Draw a line chart.
function drawLineChart(seriesTitles, data, elementId, unit) {
  var min = Infinity;
  var max = -Infinity;
  for (var i = 0; i < data.length; i++) {
    // Convert the first column to a Date.
    if (data[i] != null) {
      data[i][0] = new Date(data[i][0]);
    }

    // Find min, max.
    for (var j = 1; j < data[i].length; j++) {
      var val = data[i][j];
      if (val < min) {
        min = val;
      }
      if (val > max) {
        max = val;
      }
    }
  }

  // We don't want to show any values less than 0 so cap the min value at that.
  // At the same time, show 10% of the graph below the min value if we can.
  var minWindow = min - (max - min) / 10;
  if (minWindow < 0) {
    minWindow = 0;
  }

  // Add the definition of each column and the necessary data.
  var dataTable = new google.visualization.DataTable();
  dataTable.addColumn('datetime', seriesTitles[0]);
  for (var i = 1; i < seriesTitles.length; i++) {
    dataTable.addColumn('number', seriesTitles[i]);
  }
  dataTable.addRows(data);

  // Create and draw the visualization.
  if (!(elementId in window.charts)) {
    window.charts[elementId] =
        new google.visualization.LineChart(document.getElementById(elementId));
  }

  // TODO(vmarmol): Look into changing the view window to get a smoother
  // animation.
  var opts = {
    curveType: 'function',
    height: 300,
    legend: {position: 'none'},
    focusTarget: 'category',
    vAxis: {
      title: unit,
      viewWindow: {
        min: minWindow,
      }
    },
    legend: {
      position: 'bottom'
    }
  };
  // If the whole data series has the same value, try to center it in the chart.
  if (min == max) {
    opts.vAxis.viewWindow.max = 1.1 * max;
    opts.vAxis.viewWindow.min = 0.9 * max;
  }

  window.charts[elementId].draw(dataTable, opts);
}

// Gets the length of the interval in nanoseconds.
function getInterval(current, previous) {
  var cur = new Date(current);
  var prev = new Date(previous);

  // ms -> ns.
  return (cur.getTime() - prev.getTime()) * 1000000;
}

function getStats(callback) {
  $.getJSON('/api/meter')
  .done(function(data) { callback(data); })
  .fail(function(jqhxr, textStatus, error) {});
}

function getTopo(callback) {
  $.getJSON('/api/model')
  .done(function(data) { callback(data); })
  .fail(function(jqhxr, textStatus, error) {});
}

var on_status = false;  // avoid re-entry
function getStatus(callback) {
  if(on_status) {
    return;
  }
  
  on_status = true;
  $.getJSON('/api/status?env_id=5966ae8a77c747e1af43c3a4a80950f3&service_name=cluster')
  .done(function(data) { callback(data); on_status = false; })
  .fail(function(jqhxr, textStatus, error) { on_status = false; });
}

function drawThroughput(elementId, stats) {
  var titles = ['Time', 'Throughput'];
  var meter = [];
  var data = [];
  for (var i = 1; i < stats.stats.length; i++) {
    var cur = stats.stats[i];
    var prev = stats.stats[i - 1];
    var intervalInNs = getInterval(cur.timestamp, prev.timestamp);

    var elements = [];
    elements.push(cur.timestamp);
    elements.push((cur.meter - prev.meter) / intervalInNs);
    data.push(elements);
  }
  drawLineChart(titles, data, elementId, 'Requests/min');
}

// Refresh the stats on the page.
var editor = null;
function refresh() {
  getStats(function(stats) {
    drawThroughput('throughput', stats);
  });

  getTopo(function(model){
    $("#detail").empty();
    editor = modeler("detail", {no_plugins:true, meta:model});
  });
  
  getStatus(function(status){
    if(!status.valid)  return;
    var frontend = status.frontend;
    if (frontend.length == 0) {
      $('#frontend').text('No instance found');
      return;
    }
    var titles = [ 'Region', 'AZ', 'Count', 'Load', 'Action' ];
    var titleTypes = [ 'string', 'string', 'number', 'string', 'string' ];
    var sortIndex = 1;
    var data = [];
    for (var i = 0; i < frontend.length; i++) {
      var elements = [];
      elements.push(frontend[i].region);
      elements.push(frontend[i].az);
      elements.push(frontend[i].nodeCount);
      elements.push(frontend[i].load);
      elements.push('<img class="action" src="/hybrid_cloud/static/img/green-arrows-md.png"/><img class="action" src="/hybrid_cloud/static/img/green-inward-arrows-md.png"/>')
      data.push(elements);
    }
    drawTable(titles, titleTypes, data, 'frontend', 0, sortIndex);

    var backend = status.backend;
    var titles = [ 'Instance', 'Region', 'AZ', 'Status', 'Action' ];
    var titleTypes = [ 'string', 'string', 'string', 'string', 'string' ];
    var sortIndex = 2;
    var data = [];
    for (var i = 0; i < backend.length; i++) {
      var elements = [];
      elements.push(backend[i].inst);
      elements.push(backend[i].region);
      elements.push(backend[i].az);
      elements.push(backend[i].status);
      elements.push('<img class="action" src="/hybrid_cloud/static/img/system-shutdown-md.png"/>')
      data.push(elements);
    }
    drawTable(titles, titleTypes, data, 'backend', 0, sortIndex);
  });
}

// Executed when the page finishes loading.
function meter() {
  window.charts = {};
  refresh();
  $("#restart").click(function(){
    $.post("/action/restart", { users:$("#users").val(), freq:$("#freq").val(), address:$("#address").val() } );
  });
  $("#turnover").click(function(){
    $.post("/action/turnover");
  });
  setInterval(function() { refresh(); }, 30000);
}

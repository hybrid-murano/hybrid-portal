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

var users = "5";
var freq = "5";
var throughput = '10';
function getUsersVal(index){
  users = $("#users"+index).val();
}
function getFreqVal(index){
  freq = $("#freq"+index).val();
}
function getThroughputVal(index){
  throughput = $("#throughput"+index).val();
}
function reStart(obj, address,cluster){
  var $throughput = $(obj).parent().prev()
  var $freq = $throughput.prev()
  var $users = $freq.prev()
  throughput = Number($throughput.children()[0].value)
  freq = Number($freq.children()[0].value)
//  users = Number($users.children()[0].value)
  $("#loadingDiv").show();
  $.post("/api/meter_restart", { env_id, users:users, freq:freq, throughput:throughput, address:address,cluster:cluster}).complete(function(data){
    $("#loadingDiv").hide();
    confirm(JSON.parse(data.responseText).ret);
  });
}

function scale_up(service_name, az){
	if(service_name === ""){
	return;
	}
	$("#loadingDiv").show();
    $.getJSON('/api/scaleRcUp?env_id='+env_id+'&service_name='+service_name+'&az='+az).complete(function(data){
      $("#loadingDiv").hide();
      confirm(data.responseText);
    });
}
function scale_down(service_name, az){
    $("#loadingDiv").show();
	$.getJSON('/api/scaleRcDown?env_id='+env_id+'&service_name='+service_name+'&az='+az).complete(function(data){
      $("#loadingDiv").hide();
      confirm(data.responseText);
    });
}
function power_on(instance_id){
    $("#loadingDiv").show();
	$.getJSON('/api/start?instance_id='+instance_id).complete(function(data){
      $("#loadingDiv").hide();
      confirm(data.responseText);
    });
}
function power_off(instance_id){
    $("#loadingDiv").show();
	$.getJSON('/api/stop?instance_id='+instance_id).complete(function(data){
      $("#loadingDiv").hide();
      confirm(data.responseText);
    });
}
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
  $.getJSON('/api/sync_meter?env_id='+env_id)
  .done(function(data) { callback(data); })
  .fail(function(jqhxr, textStatus, error) {
	  callback({});
  });
}

function getTopo(callback) {
  $.getJSON('/api/model')
  .done(function(data) { callback(data); })
  .fail(function(jqhxr, textStatus, error) {});
}

var on_cpu = false;  // avoid re-entry
function getCpu(callback) {
  if(on_cpu) {
    return;
  }
  
  on_cpu = true;
  $.getJSON('/api/get_cpu?env_id='+env_id)
  .done(function(data) { callback(data); on_cpu = false; })
  .fail(function(jqhxr, textStatus, error) { on_cpu = false; });
}

var on_status = false;  // avoid re-entry
function getStatus(callback) {
  if(on_status) {
    return;
  }
  
  on_status = true;
  $.getJSON('/api/get_status?env_id='+env_id)
  .done(function(data) { callback(data); on_status = false; })
  .fail(function(jqhxr, textStatus, error) { on_status = false; });
}

function drawThroughput(elementId, stats) {
  var stat = stats.stats;
  var meter = [];
  var data = [];
  var titles = ['Time'].concat(Object.keys(stat[0].meter).toArray());
  for (var i = 0; i < stat.length; i++) {
    var cur = stat[i];
    var elements = [];
    elements.push(cur.timestamp);
    for(var j=1; j<titles.length; j++) {
    	key = titles[j];
        elements.push(cur.meter[key]);
    }
    data.push(elements);
  }
  drawLineChart(titles, data, elementId, 'Throughput(reqs/min)');
}

// Refresh the stats on the page.
function refresh() {
  getTopo(function(model){
    $("#detail").empty();
    modeler("detail", {no_plugins:true, meta:model});
  });

  getStats(function(stats) {
    drawThroughput('throughput', stats);
  });

  getStatus(function(status){
    if(!status.valid)  return;
    var frontend = status.frontend;
    if (frontend.length == 0) {
      $('#frontend').text('No instance found');
      return;
    }
    var titles = [ 'Cluster', 'Region', 'AZ', 'Count', 'Nodes', 'Load', 'Action' ];
    var titleTypes = [ 'string', 'string', 'string', 'number', 'number', 'string', 'string' ];
    var sortIndex = 1;
    var data = [];
    var changed = false;
    var targets = [];
    var meters = [];
    for (var i = 0; i < frontend.length; i++) {
      var elements = [];
      var region = frontend[i].region;
      var ip = frontend[i].ip;
      elements.push(frontend[i].name);

      if($.inArray(ip, targets) < 0) {
    	  var row = [];
          row.push(frontend[i].name);
          row.push(frontend[i].ip);
          row.push('<input type="number" id="users'+i+'" value="'+users+'" style="width: 80px;" onChange="getUsersVal('+i+')" />');
//          row.push('<input type="text" id="freq'+i+'" value="'+freq+'" style="width: 80px;"  onChange="getFreqVal('+i+')"/>');
          row.push('<input type="text" id="throughput'+i+'" value="'+throughput+'" style="width: 80px;"  onChange="getThroughputVal('+i+')"/>');
          row.push('<img id="restart" title="Restart" class="action" onclick="reStart(this,\''+frontend[i].ip+'\',\''+frontend[i].name+'\')" src="/hybrid_cloud/static/img/system-reboot-md.png"/>');
    	  meters.push(row);
    	  targets.push(ip);
      }

      var cloudIcos ={"fusionsphere":"fs-icon.png","hws":"hws-icon.png","aws":"aws-icon.png","otc":"otc-icon.png","openstack":"openstack-icon.png","vcloud":"vcloud-icon.png"};
      var regions = frontend[i].region.split("--");
      var imgName = cloudIcos[regions[1]];
      var regionStr = '<img  src="/hybrid_cloud/static/img/'+imgName+'"/>'+regions[0];
      elements.push(regionStr);
      elements.push(frontend[i].az);
      elements.push(frontend[i].instance);
      elements.push(frontend[i].nodeCount);
      elements.push(frontend[i].load);
      elements.push('<img class="action" title="Scale Up" onclick="scale_up(\''+frontend[i].scale_service+'\', \''+frontend[i].az+'\')" src="/hybrid_cloud/static/img/green-arrows-md.png"/><img class="action" title="Scale Down" onclick="scale_down(\''+frontend[i].scale_service+'\', \''+frontend[i].az+'\')" src="/hybrid_cloud/static/img/green-inward-arrows-md.png"/>')
      data.push(elements);
      changed = true;
    }
    drawTable(titles, titleTypes, data, 'frontend', 0, sortIndex);
    if(changed) {
        var titles = [ 'Cluster', 'Target', 'Number of Users', 'Requests/min', 'Action' ];
        var titleTypes = [ 'string', 'string', 'string', 'string', 'string' ];
        drawTable(titles, titleTypes, meters, 'meter', 0, sortIndex);
    }

    var backend = status.backend;
    var titles = [ 'Instance', 'Region', 'AZ', 'Status', 'Action' ];
    var titleTypes = [ 'string', 'string', 'string', 'string', 'string' ];
    var sortIndex = 2;
    var data = [];
    for (var i = 0; i < backend.length; i++) {
      var elements = [];
      var cloudIcos ={"fusionsphere":"fs-icon.png","hws":"hws-icon.png","aws":"aws-icon.png","otc":"otc-icon.png","openstack":"openstack-icon.png","vcloud":"vcloud-icon.png"};
      var regions = backend[i].region.split("--");
      var imgName = cloudIcos[regions[1]];
      var regionStr = '<img  src="/hybrid_cloud/static/img/'+imgName+'"/>'+regions[0];
      elements.push(backend[i].inst);
      elements.push(regionStr);
      elements.push(backend[i].az);
      elements.push(backend[i].status);
      if(backend[i].status === "shutoff"){
        elements.push('<img class="action" title="Start" onclick="power_on(\''+backend[i].instance_id+'\')" src="/hybrid_cloud/static/img/system-start-md.png"/>')
      } else{
        elements.push('<img class="action" title="Shutdown" onclick="power_off(\''+backend[i].instance_id+'\')" src="/hybrid_cloud/static/img/system-shutdown-md.png"/>')
      }

      data.push(elements);
    }
    drawTable(titles, titleTypes, data, 'backend', 0, sortIndex);
  });
}

function refreshCPU() {
  getCpu(function(status){
    if(!status.valid)  return;
    var frontend = status.frontend;
    if (frontend.length == 0) {
      $('#frontend').text('No instance found');
      return;
    }
    var titles = [ 'Cluster', 'Region', 'AZ', 'Count', 'Nodes', 'Load', 'Action' ];
    var titleTypes = [ 'string', 'string', 'string', 'number', 'number', 'string', 'string' ];
    var sortIndex = 1;
    var data = [];
    for (var i = 0; i < frontend.length; i++) {
      var elements = [];
      var region = frontend[i].region;
      var ip = frontend[i].ip;
      elements.push(frontend[i].name);

      var cloudIcos ={"fusionsphere":"fs-icon.png","hws":"hws-icon.png","aws":"aws-icon.png","otc":"otc-icon.png","openstack":"openstack-icon.png","vcloud":"vcloud-icon.png"};
      var regions = frontend[i].region.split("--");
      var imgName = cloudIcos[regions[1]];
      var regionStr = '<img  src="/hybrid_cloud/static/img/'+imgName+'"/>'+regions[0];
      elements.push(regionStr);
      elements.push(frontend[i].az);
      elements.push(frontend[i].instance);
      elements.push(frontend[i].nodeCount);
      elements.push(frontend[i].load);
      elements.push('<img class="action" title="Scale Up" onclick="scale_up(\''+frontend[i].scale_service+'\', \''+frontend[i].az+'\')" src="/hybrid_cloud/static/img/green-arrows-md.png"/><img class="action" title="Scale Down" onclick="scale_down(\''+frontend[i].scale_service+'\', \''+frontend[i].az+'\')" src="/hybrid_cloud/static/img/green-inward-arrows-md.png"/>')
      data.push(elements);
    }
    drawTable(titles, titleTypes, data, 'frontend', 0, sortIndex);
  });
}

// Executed when the page finishes loading.
function meter() {
  window.charts = {};
  var titles = [ 'Cluster', 'Region', 'AZ', 'Count', 'Load', 'Action' ];
  var titleTypes = [ 'string', 'string', 'string', 'number', 'string', 'string' ];
  var sortIndex = 1;
  var data = [];
  drawTable(titles, titleTypes, data, 'frontend', 0, sortIndex);
  var titles = [ 'Instance', 'Region', 'AZ', 'Status', 'Action' ];
  var titleTypes = [ 'string', 'string', 'string', 'string', 'string' ];
  var sortIndex = 2;
  var data = [];
  drawTable(titles, titleTypes, data, 'backend', 0, sortIndex);
  var titles = [ 'Cluster', 'Target', 'Number of Users', 'Requests/min', 'Action' ];
  var titleTypes = [ 'string', 'string', 'string', 'string', 'string' ];
  var data = [];
  drawTable(titles, titleTypes, data, 'meter', 0, sortIndex);
  refresh();
  /*$("#restart").click(function(){
    $.post("/action/restart", { users:$("#users").val(), freq:$("#freq").val(), address:$("#address").val() } );
  });*/
  $("#turnover").click(function(){
    $("#loadingDiv").show();
    $.post("/api/turn_over?env_id="+env_id).complete(function(data){
      $("#loadingDiv").hide();
      refresh();
    });
  });
  setInterval(function() { refresh(); }, 13000);
  setInterval(function() { refreshCPU(); }, 17000);
  
}

var env_id = ""
var environment={
  show: function() {
    $('#choose_environment').dialog("open");
  },
  submit: function() {
    $("#_set_environment").submit();
    $('#choose_environment').dialog("close");
    $("#container").show()
    meter();
  }
};

$(function () {
  $("#container").hide()
  getEnvlist(function(envs){
    if(envs.length > 0) {
        $("#environment_id").empty()
	    for (var i = envs.length -1; i>=0; i--){
	      if (i == 0){
	        $("#environment_id").append('<option value="'+envs[i].id+'" selected>'+envs[i].name+'</option>')
	      }else{
	        $("#environment_id").append('<option value="'+envs[i].id+'">'+envs[i].name+'</option>')
	      }
	   }
    }
  });
  $("#_set_environment").submit(function ()
  {
    env_id = $("#environment_id").val()
    return false
  });
  $('#_set_environment_btn').bind('click', function(){environment.submit();});
  $('#choose_environment').dialog('open');
});

function getEnvlist(callback){
  $.getJSON('/api/get_envs')
  .done(function(data) { callback(data);})
  .fail(function(jqhxr, textStatus, error) {});
}


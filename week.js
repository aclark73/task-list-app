var w = 940,
    h = 300,
    pad = 20,
    left_pad = 100,
    Data_url = '/week.json';

/* Return the date truncated to the start of day */
function getDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/* Return the # of ms between the date and start of day */
function getTime(date) {
  return date - getDay(date);
}

var today = getDay(new Date());
var msPerHour = 1000*60*60;
var msPerDay = msPerHour*24;

/* Return the # of days (calendar) since the date */
function getDaysSince(date) {
  return parseInt((today - date)/msPerDay) + 1;
}

function getDaysAgo(numDays) {
  return new Date(today.getTime() - numDays*msPerDay);
}

var svg = d3.select("#punchcard")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

var startHour = 8,
    endHour = 19,
    numDays = 7;

var x = d3.scale.linear().domain([numDays, 1]).range([left_pad, w-pad]),
    y = d3.scale.linear().domain([startHour*msPerHour, endHour*msPerHour]).range([h-pad*2, pad]);

function padded(n, size) {
  return ("0".repeat(size) + n).substr(-size);
}

function getDateString(d) {
    return "" + d.getFullYear() + "/" + padded(d.getMonth() + 1, 2) + "/" + padded(d.getDate(), 2);
}

function getTimeString(ms, full) {
    var h = parseInt(ms/msPerHour);
    var m = full ?
        (":" + padded((ms/(1000*60))%60, 2)) :
        "";
    var ap = (h > 12) ? "p" : "a";
    
    return "" + (h%12 || 12) + m + ap;
}

var xAxis = d3.svg.axis().scale(x).orient("bottom")
        .ticks(numDays)
        .tickFormat(function (d, i) {
            return getDateString(getDaysAgo(d));
        }),
    yAxis = d3.svg.axis().scale(y).orient("left")
        .ticks(endHour - startHour + 1)
        .tickFormat(function (d, i) {
            return getTimeString(d);
        });

svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0, "+(h-pad)+")")
    .call(xAxis);
 
svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate("+(left_pad-pad)+", 0)")
    .call(yAxis);
 
svg.append("text")
    .attr("class", "loading")
    .text("Loading ...")
    .attr("x", function () { return w/2; })
    .attr("y", function () { return h/2-5; });

function parseLogData(data) {
    return data.map(function(d) {
      var startTime = new Date(d.startTime);
      var endTime = new Date(d.endTime);
      return {
        daysSince: getDaysSince(startTime),
        startTime: getTime(startTime),
        endTime: getTime(endTime),
        usage: (d.timeElapsed * 1000) / (endTime - startTime),
        timeElapsed: d.timeElapsed,
        label: d.taskName + " (" + startTime.toTimeString() + " - " + endTime.toTimeString() + ")"
      };
    }).filter(function(d) {
      return d.daysSince <= numDays;
    });
}

d3.json(Data_url, function (log_data) {
    var weekly_data = parseLogData(log_data);
    // var max_width = d3.max(weekly_data.map(function (d) { return d.timeElapsed; }));
    var width = d3.scale.linear()
            .domain([0, 1])
            .range([0, 50]);
 
    svg.selectAll(".loading").remove();
 
    var rects = svg.selectAll("rect")
        .data(weekly_data)
        .enter()
        .append("rect")
        .attr("class", "timespan")
        .attr("x", function (d) { return x(d.daysSince) - width(d.usage)/2; })
        .attr("width", function (d) { return width(d.usage); })
        .attr("y", function (d) { return y(d.endTime); })
        .attr("height", function (d) { return y(d.startTime) - y(d.endTime); })
    rects.append("title").text(function(d) { return d.label; });
    rects.transition()
        .duration(800);
});

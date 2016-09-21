import React, { Component } from 'react';
import { BarStackChart, ScatterPlot } from 'react-d3-basic';
import Utils from './utils';
import TimelineChart from './TimelineChart';
import Log from './log';

export class LogChart extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.log.length != this.props.log.length;
  }

  renderTimeline() {
    
    function getTime(d) {
      var r = d.split('T')[1].split('.')[0].split(':');
      console.log(r);
      r = r.map((t, i) => {
        // i = 0/1/2 H/M/S
        return (i == 0 ? 3600 : (i == 1) ? 60 : 1) * t;
      });
      console.log(r);
      r = r.reduce((a, b) => {
        return a + b;
      });
      console.log("r is " + r);
      return r;
    }

    function pad(d) {
      return ("0" + d).slice(-2);
    }
    
    function renderTime(t) {
      var h = Math.floor(t/3600);
      var m = Math.floor((t/60)%60);
      var s = t%60;
      
      return pad(h) + ":" + pad(m) + ":" + pad(s);
    }

    const data = [];
    const chartSeries = [];
    const fields = {};
    this.props.log.forEach((log) => {
      var point = {
        startTime: log.startTime,
        series: log.task
      };
      if (!fields[log.task]) {
        fields[log.task] = 1;
        chartSeries.push({ field: log.task, name: log.task });
      }
      data.push(point);
    });

    const chartProps = {
      width: 500,
      height: 300,
      x: function(d) {
        console.log("x: d is " + d.startTime);
        return new Date(d.startTime.split('T')[0]);
      },
      y: function(d) {
        console.log("y: d is " + (d && d.startTime));
        return d ? getTime(d.startTime) : 0;
      },
      //y1: function(d) {
      //  return getTime(d.startTime);
      //},
      xScale: 'time',
      yTickFormat: renderTime,
      yDomain: [0, 60*60*24]
    };

    return (
      <TimelineChart
        data={data}
        chartSeries={chartSeries}
        {...chartProps}
      />
    );
  }
  
  renderScatter() {
    
    function getTime(d) {
      var r = d.split('T')[1].split('.')[0].split(':');
      console.log(r);
      r = r.map((t, i) => {
        // i = 0/1/2 H/M/S
        return (i == 0 ? 3600 : (i == 1) ? 60 : 1) * t;
      });
      console.log(r);
      r = r.reduce((a, b) => {
        return a + b;
      });
      console.log("r is " + r);
      return r;
    }

    const data = [];
    const chartSeries = [];
    const fields = {};
    this.props.log.forEach((log) => {
      var point = {
        startTime: log.startTime,
        series: log.task
      };
      point[log.task] = point.startTime;
      if (!fields[log.task]) {
        fields[log.task] = 1;
        chartSeries.push({ field: log.task, name: log.task });
      }
      data.push(point);
    });
    
    const chartProps = {
      width: 500,
      height: 300,
      x: function(d) {
        console.log("x: d is " + d);
        return new Date(d.startTime.split('T')[0]);
      },
      y: function(d) {
        console.log("y: d is " + d);
        return d ? getTime(d) : 0;
      },
      xScale: 'time'
    };

    return (
      <ScatterPlot
        data={data}
        chartSeries={chartSeries}
        {...chartProps}
      />
    );
  }
  
  renderStacked() {

    // load your general data
    
    const timePerDayPerTask = Utils.timePerDayPerTask(this.props.log);
    const days = Object.keys(timePerDayPerTask).sort();
    
    const tasks = {};
    const chartSeries = [];
    const data = [];
    days.forEach( (day) => {
      for (var task in timePerDayPerTask[day]) {
        if (!tasks[task]) {
          chartSeries.push({ field: task, name: task });
          tasks[task] = 1;
        }
      }
    });
    days.forEach( (day) => {
      const dayData = {
        day: day
      };
      for (var task in tasks) {
        dayData[task] = timePerDayPerTask[day][task] || 0;
      }
      data.push(dayData);
    });
    console.log(chartSeries);
    
    const chartProps = {
      width: 500,
      height: 300,
      x: function(d) {
        return d.day;
      },
      xScale: 'ordinal'
    };

    return (
      <BarStackChart
        data={data}
        chartSeries={chartSeries}
        {...chartProps}
      />
    );
  }
  
  render() {
    return this.renderStacked();
  }

}

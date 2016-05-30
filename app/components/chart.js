import React, { Component } from 'react';
import { BarStackChart, ScatterPlot } from 'react-d3-basic';
import Log from './log';

export class LogChart extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.log.length != this.props.log.length;
  }

  renderTimeline() {
    
    function getTime(d) {
      return d.split('T')[1].split(':').map((t, i) => {
        // i = 0/1/2 H/M/S
        return (i == 0 ? 3600 : (i == 1) ? 60 : 1) * t;
      }).reduce((a, b) => {
        return a + b;
      });
    }

    const chartSeries = [];
    const fields = {};
    this.props.log.forEach((log) => {
      if (!fields[log.task]) {
        fields[log.task] = 1;
        chartSeries.push({ field: log.task, name: log.task });
      }
    });
    
    const chartProps = {
      width: 500,
      height: 300,
      x: function(d) {
        return d.startTime.split('T')[0];
      },
      y: function(d) {
        return d ? getTime(d.startTime) : 0;
      },
      y1: function(d) {
        return getTime(d.startTime);
      },
      xScale: 'ordinal'
    };

    return (
      <ScatterPlot
        data={this.props.log}
        chartSeries={chartSeries}
        {...chartProps}
      />
    );
  }
  
  renderScatter() {
    
    function getTime(d) {
      return d.split('T')[1].split(':').map((t, i) => {
        // i = 0/1/2 H/M/S
        return (i == 0 ? 3600 : (i == 1) ? 60 : 1) * t;
      }).reduce((a, b) => {
        return a + b;
      });
    }

    const chartSeries = [];
    const fields = {};
    this.props.log.forEach((log) => {
      if (!fields[log.task]) {
        fields[log.task] = 1;
        chartSeries.push({ field: log.task, name: log.task });
      }
    });
    
    const chartProps = {
      width: 500,
      height: 300,
      x: function(d) {
        return d.startTime.split('T')[0];
      },
      y: function(d) {
        return d ? getTime(d) : 2;
      },
      xScale: 'ordinal'
    };

    return (
      <ScatterPlot
        data={this.props.log}
        chartSeries={chartSeries}
        {...chartProps}
      />
    );
  }
  
  renderStacked() {

    // load your general data
    
    const timePerDayPerTask = Log.TimePerDayPerTask(this.props.log);
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
    return this.renderScatter();
  }

}

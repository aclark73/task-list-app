import React, { Component } from 'react';
import { BarStackChart, ScatterPlot } from 'react-d3-basic';
import Utils from './utils';

export class LogChart extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.log.length != this.props.log.length;
  }

  render() {

    // load your general data
    
    const timePerDayPerTask = Utils.TimePerDayPerTask(this.props.log);
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
    
    const width = 500;
    const height = 300;
    const x = function(d) {
        return d.day;
      };
    const xScale = 'ordinal';

    return (
      <BarStackChart
        data={data}
        width={width}
        height={height}
        chartSeries={chartSeries}
        x={x}
        xScale={xScale}
      />
    );
  }

}

import React, { Component } from 'react';
import Utils from './utils';
import Task from './task';
import colormap from 'colormap';

const NUM_COLORS = 32;
const COLORS = colormap({
  colormap: 'rainbow',   // pick a builtin colormap or add your own 
  nshades: NUM_COLORS       // how many divisions 
});
function hashCode(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = ~~(((hash << 5) - hash) + str.charCodeAt(i));
    }
    return Math.abs(hash);
}
function getColor(str) {
  return COLORS[hashCode(str) % NUM_COLORS];
}

export default class Log extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.log.length != this.props.log.length;
  }
  
  getDuration(t1, t2) {
    try {
      return Math.floor((new Date(t2) - new Date(t1))/1000);
    }
    catch (e) {
      console.log(e);
      return 0;
    }
  }
  
  render() {
    // group by day
    const days = [];
    const entriesByDay = {};
    let lastDay = -1;
    this.props.log.forEach( (logEntry, i) => {
      const day = Utils.getDay(logEntry.startTime);
      // create new day if necessary
      if (!entriesByDay[day]) {
        days.push(day);
        entriesByDay[day] = [];
      }
      entriesByDay[day].push(logEntry);
    });
    const rows = [];
    days.forEach((day) => {
      // append the day and its rows
      const dayEntries = entriesByDay[day];
      const dayStats = {
        numEntries: dayEntries.length,
        startTime: null,
        endTime: null,
        duration: 0,
        worked: 0
      };
      dayEntries.forEach( (logEntry) => {
        if (!dayStats.startTime || dayStats.startTime > logEntry.startTime) {
          dayStats.startTime = logEntry.startTime;
        }
        if (!dayStats.endTime || dayStats.endTime < logEntry.endTime) {
          dayStats.endTime = logEntry.endTime;
        }
        dayStats.worked += logEntry.timeElapsed;
      });
      dayStats.duration = this.getDuration(dayStats.startTime, dayStats.endTime);
      const colors = colormap({
        colormap: 'summer',   // pick a builtin colormap or add your own 
        nshades: Math.max(dayStats.numEntries, 2)       // how many divisions 
      });
      function chartHeight(duration) {
        return parseInt((duration*100)/dayStats.duration);
      }
      const chartRows = dayEntries.map( (logEntry, i) => {
        const start = chartHeight(this.getDuration(dayStats.startTime, logEntry.startTime));
        const height = Math.max(
          chartHeight(this.getDuration(logEntry.startTime, logEntry.endTime)),
          Math.min(2, 100-start));
        const style = {
          bottom: '' + start + '%',
          height: '' + height + '%',
          background: getColor(logEntry.taskId)
        };
        return (
          <div id={day + 'c' + i} key={day + 'c' + i} style={style}></div>
        );
      });
      rows.push((
        <tr key={day}>
          <th></th>
          <th colSpan="4">{day}</th>
          <th>{Utils.formatTimespan(dayStats.duration)}</th>
          <th>{Utils.formatTimespan(dayStats.worked)}</th>
          <th></th>
        </tr>
      ));
      dayEntries.forEach( (logEntry, i) => {
        const label = logEntry.taskName || logEntry.task;
        const duration = this.getDuration(logEntry.startTime, logEntry.endTime);
        const utilization = Math.floor((logEntry.timeElapsed * 100) / duration);
        
        const firstCol = (i == 0) ? (
          <td className="chart" rowSpan={dayStats.numEntries}>
            {chartRows}
          </td>
        ) : undefined;
        const style = {
          background: getColor(logEntry.taskId)
        };
        rows.push((
          <tr key={day + 'r' + i} id={day + 'r' + i}>
            {firstCol}
            <td className="chart2" style={style}></td>
            <td className="start">{Utils.getTime(logEntry.startTime)}</td>
            <td className="end">{Utils.getTime(logEntry.endTime)}</td>
            <td className="task">{label}</td>
            <td className="duration">{Utils.formatTimespan(duration)}</td>
            <td className="work">{Utils.formatTimespan(logEntry.timeElapsed)}</td>
            <td className="util">{utilization}%</td>
          </tr>
        ));
      });
    });
    
    return (
      <li>
        <table>
          <thead><tr><th colSpan="2"></th><th>Start</th><th>End</th><th>Task</th><th>Time</th><th>Work</th><th>Util</th></tr></thead>
          <tbody>{rows}</tbody>
        </table>
      </li>
    );    
  }
}

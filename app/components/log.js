import React, { Component } from 'react';
import Utils from './utils';
import Task from './task';

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
      rows.push((
        <tr key={day}><th colSpan="5">{day}</th></tr>
      ));
      entriesByDay[day].forEach( (logEntry, i) => {
        const label = logEntry.taskName || logEntry.task;
        const duration = this.getDuration(logEntry.startTime, logEntry.endTime);
        const utilization = Math.floor((logEntry.timeElapsed * 100) / duration);
        rows.push((
          <tr key={day + 'r' + i}>
            <td className="time">{Utils.getTime(logEntry.startTime)}</td>
            <td className="task">{label}</td>
            <td className="time">{Utils.formatTimespan(duration)}</td>
            <td className="work">{Utils.formatTimespan(logEntry.timeElapsed)}</td>
            <td className="util">{utilization}%</td>
          </tr>
        ));
      });
    });
    
    return (
      <li>
        <table>
          <thead><tr><th>Time</th><th>Task</th><th>Time</th><th>Work</th><th>Util</th></tr></thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      </li>
    );    
  }
}

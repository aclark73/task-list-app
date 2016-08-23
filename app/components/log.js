import React, { Component } from 'react';
import Utils from './utils';
import Task from './task';

export default class Log extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.log.length != this.props.log.length;
  }
  
  render() {
    // group by day
    const days = [];
    let lastDay = -1;
    this.props.log.forEach( (logEntry, i) => {
      const day = Utils.getDay(logEntry.startTime);
      // create new day if necessary
      if (lastDay < 0 || days[lastDay].day != day) {
        days.push({
          day: day,
          entries: []
        });
        lastDay = days.length - 1;
      }
      // each day has a list of rows
      const label = logEntry.taskName || logEntry.task;
      days[lastDay].entries.push((
        <tr key={i}>
          <td className="time">{Utils.getTime(logEntry.startTime)}</td>
          <td className="task">{label}</td>
          <td className="duration">{Utils.formatTimespan(logEntry.timeElapsed)}</td>
        </tr>
      ));
    });
    const rows = [];
    days.forEach((day) => {
      // append the day and its rows
      rows.push((
        <tr key={day.day}><th colSpan="3">{day.day}</th></tr>
      ));
      Array.prototype.push.apply(rows, day.entries);
    });
    
    return (
      <li>
        <table>
          <thead><tr><th>Date</th><th>Task</th><th>Time Spent</th></tr></thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      </li>
    );    
  }
}

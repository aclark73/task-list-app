import React, { Component } from 'react';
import Utils from '../utils';
import Task from '../task';
import colormap from 'colormap';
import { Handler, HandlerPopup } from './handler';
import classNames from 'classnames';

/* These are mostly for drawing */
const NUM_COLORS = 32;
const COLORS = colormap({
  colormap: 'rainbow-soft',   // pick a builtin colormap or add your own
  nshades: NUM_COLORS       // how many divisions
});
function hashCode(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = ~~(((hash << 5) - hash) + str.charCodeAt(i));
    }
    return Math.abs(hash);
}
function getColor2(str) {
  return COLORS[hashCode(str) % NUM_COLORS];
}
function getColor(logEntry) {
  const hue = Task.getProjectColor(logEntry.project);
  return 'hsl(' + hue + ',100%,85%)';
}
function getStyle(logEntry) {
  const hue = Task.getProjectColor(logEntry.project);
}

/**
 * Show the work log
 * <Log log=[log entries] />
 */
export default class Log extends Component {

  constructor(props) {
      super(props);
      this.state = {
          edit: '',
          editStart: '',
          editEnd: ''
      };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (nextProps.log.length != this.props.log.length) ||
      (nextState.edit != this.state.edit);
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

  getLogEntryId(logEntry) {
    return logEntry.taskId + '.' + logEntry.startTime;
  }

  edit(logEntryId) {
    this.setState({
      edit: logEntryId
    });
  }

  render() {
    // 2017-02-24
    // 12:30 - 2:30 Documentation #21 35m (34%)
    // 2:30 - 4:00 Github Style 90m (100%)

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
      dayEntries.reverse();
      const dayStats = {
        numEntries: dayEntries.length,
        startTime: null,
        endTime: null,
        duration: 0,
        worked: 0
      };
      // Cumulative day stats
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
      rows.push((
        <div key={day} className="day">
          <span className="date">{day}</span>
          <span className="stats">
            <span className="worked">{Utils.formatTimespan(dayStats.worked, true)}</span>
            <span className="duration"> ({Utils.formatTimespan(dayStats.duration, true)})</span>
          </span>
        </div>
      ));
      function chartHeight(duration) {
        return parseInt((duration*100)/dayStats.duration);
      }
      const chartRows = [];
      let lastOne = null;
      dayEntries.forEach( (logEntry, i) => {
        const start = chartHeight(this.getDuration(dayStats.startTime, logEntry.startTime));
        const height = Math.max(
          chartHeight(this.getDuration(logEntry.startTime, logEntry.endTime)),
          Math.min(2, 100-start));
        const style = {
          bottom: '' + start + '%',
          height: '' + height + '%',
          background: getColor(logEntry)
        };
        return (
          <div id={day + 'c' + i} key={day + 'c' + i} style={style}></div>
        );
      });
      // The log entries
      const subrows = [];
      dayEntries.forEach( (logEntry, i) => {
        const label = logEntry.taskName || logEntry.task;
        const duration = this.getDuration(logEntry.startTime, logEntry.endTime);
        const utilization = Math.floor((logEntry.timeElapsed * 100) / duration);

        const style = {
          background: getColor(logEntry)
        };
        const logEntryId = this.getLogEntryId(logEntry);
        const editing = (logEntryId == this.state.edit);
        const edit = () => {
          console.log("Editing " + logEntryId);
          this.edit(logEntryId);
        };
        const className = classNames(
          'log-entry',
          { 'editing': editing }
        );
        subrows.push((
          <div key={day + 'r' + i} id={day + 'r' + i} className={className}>
            <div className="chart">{chartRows[i]}</div>
            <span className="colorsquare" style={style}></span>
            <span className="timespan">
              <span className="start">{Utils.getTime(logEntry.startTime)}</span> -
              <span className="end">{Utils.getTime(logEntry.endTime)}</span>
            </span>
            <span className="task-name"><a href="#" onClick={edit}>{label}</a></span>
            <span className="stats">
              <span className="worked">{Utils.formatTimespan(logEntry.timeElapsed, true)}</span>
              <span className="duration">{Utils.formatTimespan(duration, true)}</span>
              <span className="util">{utilization}%</span>
            </span>
          </div>
        ));
      });

      rows.push((
        <div className="work">
          {subrows}
        </div>
      ));

    });

    return (
      <li>
        {rows}
      </li>
    );
  }
}

/* Where is this used? */
class StatusPopup extends HandlerPopup {

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
        dayEntries.reverse();
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

  renderContents() {
    return this.props.messages.map( (message, i) => {
      return (
        <li key={i}>{message}</li>
      );
    });
  }


}

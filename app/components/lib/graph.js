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
function hoursToMS(h) {
    return h * 60 * 60 * 1000;
}
function roundToHour(t, offset) {
    let d = new Date(t);
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);
    if (offset) {
      d.setHours(d.getHours() + offset);
    }
    return d;
}
function getDurationMS(t1, t2) {
  try {
    const duration = Math.floor((new Date(t2) - new Date(t1)));
    if (isNaN(duration)) {
      throw "NaN!";
    }
    // console.log("" + t2 + " - " + t1 + " = " + duration);
    return duration;
  }
  catch (e) {
    console.log("" + t1 + " - " + t2 + " = " + e);
    return 0;
  }
}
/* Format a short time, eg. '6a', '9p'*/
function toShortTime(h) {
    const am_pm = (h < 12) ? 'a' : 'p';
    const hour = (h % 12) || 12;
    return '' + hour + am_pm;
}

/**
 * Show the work log
 * <Log log=[log entries] />
 */
export default class Graph extends Component {

  constructor(props) {
      super(props);
      this.state = {
          lastTime: null,
      };
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (!nextState.popup) { return false; }
    try {
      if (nextProps.log[0].endTime != this.state.lastTime) {
        this.setState({
          lastTime: nextProps.log[0].endTime
        });
        console.log("updating graph");
        return true;
      }
    } catch (e) {}
    return false;
  }

  getDuration(t1, t2) {
    return getDurationMS(t1, t2)/1000;
  }

  getLogEntryId(logEntry) {
    return logEntry.taskId + '.' + logEntry.startTime;
  }

  render() {

    console.log("Rendering log");
    const MIN = 60*1000;
    const HOUR = 60*MIN;
    const DAY = 24*HOUR;

    let lastEntry = null;

    const span = 7*DAY;
    const end = new Date(this.state.lastTime));
    const start = new Date(end - span);
    const bounds = (start, end);
    const granularity = 100;
    const scale = span/granularity;

    toX = (t) => {
        return (new Date(t) - start)*scale;
    }

    const lanes = {};

    this.props.log.forEach( (logEntry, i) => {
      // Horizontally across time period
      const x0 = toX(logEntry.startTime);
      if (x0 > 100) { return; }
      const x1 = toX(logEntry.endTime);
      if (x1 < 0) { return; }

      if (!lanes[logEntry.taskId]) {
        lanes[logEntry.taskId] = [];
      }
      
      lanes[logEntry.taskId].push((
        <div class="graphentry" props=
        </div>
      )
        center: (x0 + x1) / 2,
        width: x1 - x0,
        weight: logEntry.duration;
      });
        const title = Utils.getDayTime(logEntry.startTime) + " - " + Utils.getDayTime(logEntry.endTime);
        subrows.push((
          <div key={groupIdx + '.' + i} className={className} title={title}>
            <div className="chart">
              {chartRow}
            </div>
            <span className="colorsquare" style={style}></span>
            <span className="task-name"><a href="#" onClick={edit}>{label}</a></span>
            <span className="timespan">{timespan}</span>
            <span className="stats">
              <span className="worked">{Utils.formatTimespan(logEntry.timeElapsed, true)}</span>
              <span className="duration">{Utils.formatTimespan(duration, true)}</span>
              <span className="util">{utilization}%</span>
            </span>
          </div>
        ));
      });

      rows.push((
        <div key={groupIdx + 'w'} className="work">
          <div className="chart">
            {chartMarkers}
          </div>
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

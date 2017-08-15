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

class GroupChart {

    constructor(id, startTime, endTime) {
        this.id = id;
        this.startTime = roundToHour(startTime, 0);
        this.endTime = roundToHour(endTime, 1);
        this.durationMS = getDurationMS(this.startTime, this.endTime);
    }

    /* Create a row for the given entry. It is absolutely positioned
     * and sized in proportion to its duration.
     */
    createChartRow(logEntry, i) {
        const offset = this.chartHeight(this.getLogOffsetMS(logEntry.startTime));
        const height = Math.max(
            this.chartHeight(getDurationMS(logEntry.startTime, logEntry.endTime)),
            Math.min(2, 100-offset));
        const style = {
            bottom: '' + offset + '%',
            height: '' + height + '%',
            background: getColor(logEntry)
        };
        return (
            <div key={this.id + '-' + i} className="chart-label" style={style}></div>
        );
    }

    /* Height in px for a chart of duration ms */
    chartHeight(duration) {
        const height = parseInt((duration*100)/this.durationMS);
        if (isNaN(height)) {
            console.log("NaN for " + duration + " / " + this.durationMS);
        }
        return height;
    }
    /* Get offset from start time */
    getLogOffsetMS(logTime) {
        return getDurationMS(this.startTime, logTime);
    }
    formatMarkerLabel(h) {
        return toShortTime(h);
        /*
        if (h == 12) { return 'n'; }
        if (h == startTime) { return toShortTime(h); }
        if (h == endTime) { return toShortTime(h); }
        return '';
        */
    }
    createMarker(h) {
        const isTop = (h == this.endTime.getHours());
        const className = classNames(
          'chart-time-label',
          { 'chart-time-label-top': isTop }
        );
        const style = isTop ?
            {top:"0%"} :
            {bottom:""+this.chartHeight(hoursToMS(h-this.startTime.getHours()))+'%'};
        const label = this.formatMarkerLabel(h);
        return (
            <div key={this.id + '.' + h} style={style} className={className}><span>{label}</span></div>
        );
    }
    createMarkers(numRows) {
        const chartMarkers = [];
        const hoursPerMarker = parseInt(8/numRows);
        const t = new Date(this.startTime);
        while (t <= this.endTime) {
          chartMarkers.push(this.createMarker(t.getHours()));
          t.setHours(t.getHours() + 1);
        }
        return chartMarkers;
    }
}

/**
 * Show the work log
 * <Log log=[log entries] />
 */
const RECENT_HOURS = 3;
const RECENT_HOURS_MS = RECENT_HOURS*3600*1000;

export default class Recent extends Component {

  constructor(props) {
      super(props);
      this.state = {
          edit: '',
          editStart: '',
          editEnd: '',
          lastTime: null,
      };
  }

  shouldComponentUpdate(nextProps, nextState) {
    try {
      if (nextProps.log[0].endTime != this.state.lastTime) {
        this.setState({
          lastTime: nextProps.log[0].endTime
        });
        console.log("updating recent");
        return true;
      }
    } catch (e) {}
    return (nextState.edit != this.state.edit);
  }

  getDuration(t1, t2) {
    return getDurationMS(t1, t2)/1000;
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

    console.log("Rendering recent");

    const oldestTime = (new Date()) - RECENT_HOURS_MS);

    const entries = [];

      // The log entries
      const subrows = [];
      let done = false;
      this.state.log.slice(0,10).forEach( (logEntry, i) => {
        if (done) { return; }
        if (logEntry.endTime < oldestTime) { return; }
        const label = logEntry.taskName || logEntry.task;
        const duration = this.getDuration(logEntry.startTime, logEntry.endTime);
        const utilization = Math.floor((logEntry.timeElapsed * 100) / duration);
        const timespan = "" + Utils.getTime(logEntry.startTime) + " - " + Utils.getTime(logEntry.endTime);
        const chartRow = groupChart.createChartRow(logEntry, i);
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
        const title = Utils.getDayTime(logEntry.startTime) + " - " + Utils.getDayTime(logEntry.endTime);
        const now = new Date();
        const x1 = getDurationMS(logEntry.start, now);
          <div key={groupIdx + '.' + i} className={className} title={title}>
            <span className="colorsquare" style={style}></span>
            <span className="task-name"><a href="#" onClick={edit}>{label}</a></span>
            <span className="timespan">{timespan}</span>
            <span className="stats">
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

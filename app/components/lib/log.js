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
            <div className="chart">
              <div className="chart-inner">
                <div key={i} className="chart-label" style={style}></div>
              </div>
            </div>
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
    formatMarkerLabel(t) {
        return toShortTime(t.getHours());
    }
    createMarker(t) {
        // Truncate to the hour
        const h = roundToHour(t);
        const isTop = (t >= this.endTime);
        const className = classNames(
          'chart-time-label',
          { 'chart-time-label-top': isTop }
        );
        const style = isTop ?
            {top:"0%"} :
            {bottom:""+this.chartHeight(h-this.startTime)+'%'};
        const label = this.formatMarkerLabel(h);
        return (
            <div key={t} style={style} className={className}><span>{label}</span></div>
        );
    }
    createMarkers(numRows) {
        const chartMarkers = [];
        const hoursPerMarker = Math.max(parseInt(8/numRows),1);
        const t = roundToHour(this.startTime);
        while (t <= this.endTime) {
          chartMarkers.push(this.createMarker(t));
          t.setHours(t.getHours() + hoursPerMarker);
        }
        return (
          <div className="chart">
            <div className="chart-inner">
              {chartMarkers}
            </div>
          </div>
        );
    }
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
          editEnd: '',
          lastLogTime: null,
      };
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (!nextProps.visible) { return false; }
    try {
        if (nextState.lastLogTime != this.state.lastLogTime) {
            console.log("updating log (again?)");
            return true;
        }
      if (nextProps.log[0].endTime != this.state.lastLogTime) {
        this.setState({
          lastLogTime: nextProps.log[0].endTime
        });
        console.log("updating log");
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

    console.log("Rendering log");

    // grouped in chunks
    const groups = [];
    const entriesByGroup = {};
    let lastEntry = null;

    const mergeGapSize = 10*60;
    const groupGapSize = 6*60*60;

    this.props.log.forEach( (logEntry, i) => {
      const gap = (lastEntry ?
        this.getDuration(logEntry.endTime, lastEntry.startTime) :
        -1);
      // console.log("Gap:", gap, Utils.getDayTime(logEntry.endTime), Utils.getDayTime(lastEntry && lastEntry.startTime));
      if (lastEntry
          && lastEntry.taskId == logEntry.taskId
          && gap > 0 && gap < mergeGapSize) {
        // Merge with previous entry
        console.log("Merging log");
        lastEntry.startTime = logEntry.startTime;
        lastEntry.timeElapsed += logEntry.timeElapsed;
        lastEntry.taskName += "*";
      } else {
        // create new group
        if (!lastEntry || gap > groupGapSize) {
          console.log("Creating new group");
          groups.push([]);
        }
        // Add a copy since we might merge things into it
        lastEntry = Object.assign({}, logEntry);
        groups[groups.length - 1].push(lastEntry);
      }
    });
    const rows = [];
    groups.forEach((group, groupIdx) => {
      // dayEntries.reverse();
      const groupStats = {
        numEntries: group.length,
        startTime: null,
        endTime: null,
        duration: 0,
        worked: 0
      };
      // Cumulative stats
      group.forEach( (logEntry) => {
        if (!groupStats.startTime || groupStats.startTime > logEntry.startTime) {
          groupStats.startTime = logEntry.startTime;
        }
        if (!groupStats.endTime || groupStats.endTime < logEntry.endTime) {
          groupStats.endTime = logEntry.endTime;
        }
        groupStats.worked += logEntry.timeElapsed;
      });
      groupStats.duration = this.getDuration(groupStats.startTime, groupStats.endTime);
      const timespan = Utils.getDayTime(groupStats.startTime) + " - " + Utils.getDayTime(groupStats.endTime);
      rows.push((
        <div key={groupIdx} className="day">
          {timespan}
          <span className="stats">
            <span className="worked">{Utils.formatTimespan(groupStats.worked, true)}</span>
            <span className="duration"> ({Utils.formatTimespan(groupStats.duration, true)})</span>
          </span>
        </div>
      ));

      const groupChart = new GroupChart(groupIdx, groupStats.startTime, groupStats.endTime);
      const chartMarkers = groupChart.createMarkers(group.length);

      // The log entries
      const subrows = [];
      group.forEach( (logEntry, i) => {
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
        subrows.push((
          <div key={groupIdx + '.' + i} className={className} title={title}>
            {chartRow}
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
          {chartMarkers}
          <div>
            {subrows}
          </div>
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

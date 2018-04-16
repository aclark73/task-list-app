import React, { Component } from 'react';
import Task from './task';
import Utils from './utils';
import colormap from 'colormap';
import { lighten, hexToHslTuple } from 'colorutilities';

const plasma_map = colormap({
  // colormap: 'cool',   // pick a builtin colormap or add your own
  colormap: 'rdbu',
  /*
  colormap: [
    {"index":0,"rgb":[255, 255, 51]},
    {"index":0.1,"rgb":[255, 255, 51]},
    {"index":0.4,"rgb":[102, 255, 102]},
    {"index":0.7,"rgb":[204, 204, 255]},
    {"index":1,"rgb":[204, 170, 255]}
  ],
  */
  nshades: 72,       // how many divisions
  format: 'hex',     // "hex" or "rgb" or "rgbaString"
  alpha: 1           // set an alpha value or a linear alpha mapping [start, end]
});
const bg_map = plasma_map.map(function(c, i) {
  const adj = (71-i);
  const hsl = hexToHslTuple(c);
  // console.log(hsl);

  // return c;
  // console.log(c + ' x ' + adj + '% = ' + cl);
  return 'hsl(' + hsl[0] + ',' + hsl[1] + ',90%)';
});

const bg_colors = [];
for (var hue=50; hue<=360; hue+=4) {
  const s = 100 - Math.max(0, (hue-200)/2);
  bg_colors.push('hsl(' + hue + ',' + s + '%,75%)');
}
const num_colors = bg_colors.length;

const ageColor = function(delta) {
  // delta (s)
  const adj_delta = Math.sqrt(delta);
  const min_delta = 0; // Math.sqrt(60*60*24); // 1 day
  const max_delta = Math.sqrt(60*60*24*365*1); // 1 year
  if (adj_delta < min_delta) {
    return bg_colors[0];
  }
  else if (adj_delta > max_delta) {
    return bg_colors[num_colors-1];
  }
  else {
    const idx = parseInt((num_colors * adj_delta) / max_delta);
    return bg_colors[idx];
  }
};

export class TaskWidget extends Component {
  select() {
    this.props.context.actions.setTask(this.props.task);
  }
  start() {
    this.props.context.actions.start(this.props.task);
    // If this is done by double-clicking the text may be selected
    // This is annoying so clear it
    window.getSelection().removeAllRanges();
  }
  info() {
    console.log("Task: " + Task.getLabel(this.props.task));
  }
  selected() {
    return (this.props.context.selectedTaskId == Task.getUID(this.props.task));
  }
  renderInner(className, toggleWidget, rows) {
    const select = this.select.bind(this);
    const start = this.start.bind(this);
    const info = this.info.bind(this);

    className = className + ' task-item';
    if (this.selected()) {
      className = className + ' selected';
    }
    if (rows) {
      rows = (
        <ul>
          {rows}
        </ul>
      );
    }

    // 2 examples of doing the same thing:
    // 1. The function looks directly at this
    // This seems more readable to me
    const project_label = (() => {
      var view = this.props.context.view;
      var project = this.props.task.project;
      if (view == 'tasks') {
        const hue = Task.getProjectColor(project);
        const style = {
          backgroundColor: 'hsl(' + hue + ',100%,96%)',
          borderColor: 'hsl(' + hue + ',50%,70%)',
          color: 'hsl(' + hue + ',100%,20%)'
        };
        return (
          <div className="label project-label"
            style={style}>{project}</div>
        );
      } else {
        return "";
      }
    })();
    // 2. The right way
    const updated_label = ((updated_on) => {
      if (updated_on) {
        const d = new Date(updated_on);
        const delta = Utils.getDuration(updated_on, new Date());
        const style = {
          backgroundColor: ageColor(delta)
        };
        return (
          <div className="label updated-label" style={style}>
            {Utils.humanTimespan(delta)}
          </div>
        );
      } else {
        return "";
      }
    })(this.props.task.updated_on);
    const issue_label = ((issue_number) => {
        if (issue_number) {
            return (<div className="label issue-label">#{issue_number}</div>);
        } else {
            return "";
        }
    })(this.props.task.issue_number);
    return (
      <li key={this.props.task}>
        <div className={className}>
          {toggleWidget}
          <div className="task-label" onClick={select} onDoubleClick={start}>
            <div className="task-labels">
                {project_label}
                {updated_label}
            </div>
            {issue_label}
            <div className="task-title">
                {Task.getLabel(this.props.task)}
            </div>
          </div>
        </div>
        {rows}
      </li>
    );
  }

  render() {
    return this.renderInner('task', '', '');
  }
}

export class ProjectWidget extends TaskWidget {
  constructor(props) {
    super(props);
    this.state = {
      toggle: !!props.toggle
    };
  }
  toggle() {
    this.setState({toggle: !this.state.toggle});
  }
  render() {
    const rows = [];
    this.props.task.tasks.forEach( (task) => {
      if (task) {
        rows.push(<TaskWidget key={Task.getUID(task)} task={task} context={this.props.context} />);
      }
    });

    const toggle = this.toggle.bind(this);
    const toggleClass = 'fa fa-chevron-circle-' + (this.state.toggle ? 'down' : 'right');
    const toggleWidget = (
      <span className="btn btn-toggle" onClick={toggle}><i className={toggleClass}></i></span>
    );

    const className = 'project' + (this.state.toggle ? ' toggled' : '');
    return this.renderInner(className, toggleWidget, rows);
  }

}

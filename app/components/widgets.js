import React, { Component } from 'react';
import Task from './task';
import humanizeDuration from 'humanize-duration';

const shortEnglishHumanizer = humanizeDuration.humanizer({
  language: 'shortEn',
  largest: 1,
  spacer: '',
  languages: {
    shortEn: {
      y: function() { return 'y' },
      mo: function() { return 'mo' },
      w: function() { return 'w' },
      d: function() { return 'd' },
      h: function() { return 'h' },
      m: function() { return 'm' },
      s: function() { return 's' },
      ms: function() { return 'ms' },
    }
  },
  round: true
});

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

    // Keep the local definitions more readable
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
    // The right way
    const updated_label = ((updated_on) => {
      if (updated_on) {
        var d = new Date(updated_on);
        var now = new Date();
        d = shortEnglishHumanizer(now.getTime() - d.getTime());
        return (<div className="label updated-label">{d}</div>);
      } else {
        return "";
      }
    })(this.props.task.updated_on);
    const issue_label = ((issue_num) => {
        if (issue_num) {
            return (<div className="label issue-label">{issue_num}</div>);
        } else {
            return "";
        }
    })(this.props.task.issue_num);

    return (
      <li key={this.props.task}>
        <div className={className}>
          {toggleWidget}
          <div className="task-label" onClick={select} onDoubleClick={start}>
            {issue_label}
            {project_label}
            {updated_label}
            {Task.getLabel(this.props.task)}
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

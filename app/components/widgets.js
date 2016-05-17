import React, { Component } from 'react';
import Task from './task';
import humanize from 'humanize';

export class TaskWidget extends Component {
  select() {
    this.props.context.actions.setTask(this.props.task);
  }
  start() {
    this.props.context.actions.start(this.props.task);
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

    const updated_on = ((updated_on) => {
      if (updated_on) {
        var d = new Date(updated_on);
        return humanize.relativeTime(d.getTime() / 1000);
      }
      return "";
    })(this.props.task.updated_on);
    return (
      <li>
        <div className={className}>
          {toggleWidget}
          <span className="btn btn-start" onClick={start}><i className="fa fa-clock-o"></i></span>
          <div className="label" onClick={select} onDoubleClick={start}>
            <div className="updated_on">{updated_on}</div>
            {Task.getLabel(this.props.task)}&nbsp;
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

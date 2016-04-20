import React, { Component } from 'react';
import Task from './task';

export class TaskWidget extends Component {
  select() {
    this.props.context.setTask(Task.getUID(this.props.task));
  }
  start() {
    this.props.context.start();
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
    
    return (
      <li>
        <div className={className}>
          {toggleWidget}
          <a href="#" onClick={start}>Go</a>
          <div onClick={select} onDoubleClick={start}>
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
      toggle: true
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
    const toggleWidget = (
      <a href="#" className="toggle" onClick={toggle}>+</a>
    );

    const className = 'project' + (this.state.toggle ? ' toggled' : '');
    return this.renderInner(className, toggleWidget, rows);
  }
  
}
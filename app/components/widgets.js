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
  renderInner() {
    const select = this.select.bind(this);
    const start = this.start.bind(this);
    const info = this.info.bind(this);
    const className = 'label' + (this.selected() ? ' selected' : '');
    return (
      <div className={className} onClick={select} onDoubleClick={start}>
        {Task.getLabel(this.props.task)}
        <div className="controls">
          <button onClick={select}>Select</button>         
          <a href="#" onClick={info} >{Task.getLabel(this.props.task)}</a>
        </div>
      </div>
    );
  }
  
  render() {
    const inner = this.renderInner();
    const selected = this.selected() ? 'selected' : '';
    return (
      <li className="task">
        {inner}
      </li>
    );
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
    const inner = this.renderInner();
    const toggle = this.toggle.bind(this);
    const className = 'project' + (this.state.toggle ? ' toggled' : '');
    return (
      <li className={className}>
        <input type="checkbox" onChange={toggle} />
        {inner}
        <ul>{rows}</ul>
      </li>
    );
  }
  
}
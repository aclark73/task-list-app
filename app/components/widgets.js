import React, { Component } from 'react';
import Task from './task';

export class TaskWidget extends Component {
  select() {
    this.props.context.setTask(Task.getUID(this.props.task));
  }
  info() {
    console.log("Task: " + Task.getLabel(this.props.task));
  }
  selected() {
    return (this.props.context.selectedTaskId == Task.getUID(this.props.task));
  }
  renderInner() {
    const select = this.select.bind(this);
    const info = this.info.bind(this);
    const selected = this.selected() ? 'selected' : '';
    return (
      <div className="label {selected}">
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
    return (
      <li className="task {selected}">
        {inner}
      </li>
    );
  }
}

export class ProjectWidget extends TaskWidget {
  toggle() {
    this.props.toggle = !this.props.toggle;
    this.setState({toggle: this.props.toggle});
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
    return (
      <li className="task {selected}">
        <input type="checkbox" checked="{this.props.toggle}" onChange={toggle} />
        {inner}
        <ul>{rows}</ul>
      </li>
    );
        
    const select = this.select.bind(this);
    const info = this.info.bind(this);
    const selected = this.selected() ? 'selected' : '';
    return (
      <li className="project {selected}">
        {Task.getLabel(this.props.task)}
        <div className="controls">
          <button onClick={select}>Select</button>
          <a href="#" onClick={info} >{Task.getLabel(this.props.task)}</a>
        </div>
      </li>
    );
  }
  
}
import React, { Component } from 'react';
import RedmineTaskParser from './redmine';
import Task from './task';

class Row extends Component {
  handleClick() {
    this.props.handleClick(Task.getUID(this.props.task));
  }
  handleToggle() {
    this.setState({toggle: !this.state.toggle});
  }
  render() {
    const handleClick = this.handleClick.bind(this);
    const handleToggle = this.handleToggle.bind(this);
    if (Task.isProject(this.props.task)) {
      const rows = [];
      this.props.task.tasks.forEach( (task) => {
        if (task) {
          rows.push(<Row key={Task.getUID(task)} task={task} handleClick={this.props.handleClick} />);
        }
      });
      return (
        <li>
          <div className="project"><input type="checkbox" checked="{this.state.toggle}" onChange={handleToggle} /><a href="#" onClick={handleClick} >{Task.getLabel(this.props.task)}</a></div>
          <ul>{rows}</ul>
        </li>
      );
    } else {
      return (
        <li>
          <div className="task"><a href="#" onClick={handleClick} >{Task.getLabel(this.props.task)}</a></div>
        </li>
      );
    }
  }
}

const ROWS = [
  {label: "Item 1"},
  {label: "Item 2"},
  {label: "Item 3"},
  {label: "Item 4"},
  {label: "Item 5"}
];

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projects: []
    };
  }
  getUID(task) {
    
  }
  handleUpdate() {
    const parser = new RedmineTaskParser();
    parser.load().then( (projects) => {
      this.setState({projects: projects});
    });
  }
  handleRowClick(row) {
    console.log("Clicked on row: " + row);
  }
  render() {
    const rows = [];
    this.state.projects.forEach( (project) => {
      if (project) {
        rows.push(<Row key={Task.getUID(project)} task={project} handleClick={this.handleRowClick} />);
      }
    });
    const this_handleUpdate = this.handleUpdate.bind(this);
    return(
      <div >
        <h1>Hello World</h1>
        <div><button type="button" onClick={this_handleUpdate}>Update</button></div>
        <ul>{rows}</ul>
      </div>
    );
  }
}

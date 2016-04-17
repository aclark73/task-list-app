import React, { Component } from 'react';
import './redmine';

class Row extends Component {
  handleClick() {
    this.props.handleClick(this.props.label);
  }
  render() {
    const handleClick = this.handleClick.bind(this);
    return (
      <li>
        {this.props.label}
        <button type="button" onClick={handleClick} />
      </li>
    );
  }
}

const ROWS = [
  {label: "Item 1"},
  {label: "Item 2"},
  {label: "Item 3"},
  {label: "Item 4"},
  {label: "Item 5"}
];

const Task = {
  isProject: function(task) {
    return !task.title;
  },
  getProjectUID: function(project) {
    return "P." + project.project;
  },
  getTaskUID: function(task) {
    if (task.issue_id) {
      return "T." + task.source + "." + task.issue_id;
    } else {
    	return "T." + task.source + "." + task.project + "." + task.title;
    }  
  },
  getUID: function(task) {
		if (Task.isProject(task)) {
      return Task.getProjectUID(task);
    } else {
      return Task.getTaskUID(task);
    }
  },
  getLabel: function(task) {
    if (Task.isProject(task)) {
      return task.project;
    } else if (task.issue_id) {
      return '#' + task.issue_id + ' - ' + task.title;
    } else {
      return task.title;
    }
  }
};

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tasks: []
    };
  }
  getUID(task) {
    
  }
  handleUpdate() {
    const parser = new redmine.RedmineTaskParser();
    parser.load().then(function(tasks) {
      this.setState({tasks: tasks});
    });
  }
  handleRowClick(row) {
    console.log("Clicked on row: " + row);
  }
  render() {
    const rows = [];
    const handleRowClick = this.handleRowClick.bind(this);
    this.state.tasks.forEach(function(task) {
      rows.push(<Row key={Task.getUID(task)} label={Task.getLabel(task)} handleClick={handleRowClick} />);
    });
    const handleUpdate = this.handleUpdate.bind(this);
    return(
      <div >
        <h1>Hello World 3</h1>
        <div><button type="button" onClick={handleUpdate}>Update</button></div>
        <ul>{rows}</ul>
      </div>
    );
  }
}

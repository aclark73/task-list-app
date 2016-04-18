import React, { Component } from 'react';
import RedmineTaskParser from './redmine';
import Task from './task';
import { TaskWidget, ProjectWidget } from './widgets';

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
      projects: [],
      taskId: null,
      startTime: null,
      timeElapsed: 0,
      timeRemaining: 0,
      workTime: 60*5,
      breakTime: 60,
      timer: null
    };
  }
  loadRedmine() {
    const parser = new RedmineTaskParser();
    parser.load().then( (projects) => {
      this.setState({projects: projects});
    });
  }
  refresh() {
    console.log("refresh");
    this.loadRedmine();
  }
  handleRowClick(row) {
    console.log("Clicked on row: " + row);
  }
  render() {
    const context = {
      setTask: this.setTask.bind(this),
      refresh: this.refresh.bind(this),
      selectedTaskId: this.state.taskId
    };
    
    const rows = [];
    this.state.projects.forEach( (project) => {
      if (project) {
        rows.push(<ProjectWidget key={Task.getUID(project)} task={project} context={context} />);
      }
    });
    return(
      <div >
        <h1>Tasks</h1>
        <div><button type="button" onClick={context.refresh}>Update</button></div>
        <div className="tasks"><ul>{rows}</ul></div>
      </div>
    );
  }
  setTask(taskId) {
    console.log("setTask: " + taskId);
    this.setState({
      taskId: taskId,
    });
  }
  
  /* Timer */
  startTimer(taskId) {
    var tick = this.tick.bind(this);
    this.setState({
      taskId: taskId,
      startTime: new Date(),
      timeElapsed: 0,
      timeRemaining: this.state.workTime,
      timer: window.setTimeout(tick, 1000)
    });
  }
  tick() {
    this.setState({
      timeElapsed: this.state.timeElapsed + 1,
      timeRemaining: this.state.timeRemaining - 1
    });
    if (this.state.timeRemaining <= 0) {
      this.expire();
    }
  }
  expire() {
    if (this.state.startTime) {
      this.log(this.state);
    }
    window.cancelTimeout(this.state.timer);
  }
  log(state) {
    console.log("LOG: task: %s startTime: %s timeElapsed: %s");
  }
  
}

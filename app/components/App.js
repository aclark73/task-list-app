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
      compactView: false,
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
      start: this.start.bind(this),
      toggleCompactView: this.toggleCompactView.bind(this),
      toggleProjects: this.toggleProjects.bind(this),
      selectedTaskId: this.state.taskId
    };
    
    const rows = [];
    this.state.projects.forEach( (project) => {
      if (project) {
        rows.push(<ProjectWidget key={Task.getUID(project)} task={project} context={context} />);
      }
    });
    const tasksClassName = 'tasks' + (this.state.compactView ? ' compact' : '');
    return(
      <div>
        <h1>Tasks</h1>
        <div>Current: {this.state.taskId}</div>
        <div>{this.state.timeElapsed} / {this.state.timeRemaining}</div>
        <div><button type="button" onClick={context.refresh}><i className="fa fa-refresh"></i></button></div>
        <div><button type="button" onClick={context.toggleCompactView}>Compact</button></div>
        <div className={tasksClassName}><ul>{rows}</ul></div>
      </div>
    );
  }
  setTask(taskId) {
    if (taskId != this.state.taskId) {
      console.log("setTask: " + taskId);
      this.setState({
        taskId: taskId,
      });
    }
  }
  toggleCompactView() {
    this.setState({
      compactView: !this.state.compactView
    });
  }
  toggleProjects() {
    
  }
  /* Timer */
  start(taskId) {
    const changedTask = (taskId && taskId != this.state.taskId);
    if (changedTask) {
      this.setTask(taskId);
    }
    if (!changedTask && this.state.timer) {
      console.log("restart");
      // Don't interfere with timer, just reset the remaining time
      this.setState({
        timeRemaining: this.state.workTime
      });
    } else {
      console.log("start");
      var tick = this.tick.bind(this);
      this.setState({
        startTime: new Date(),
        timeElapsed: 0,
        timeRemaining: this.state.workTime,
        timer: window.setInterval(tick, 1000)
      });
    }
  }
  tick() {
    if (this.state.timer) {
      this.setState({
        timeElapsed: this.state.timeElapsed + 1,
        timeRemaining: this.state.timeRemaining - 1
      });
      if (this.state.timeRemaining <= 0) {
        this.stop();
      }
    }
  }
  stop() {
    if (this.state.timer) {
      if (this.state.startTime) {
        this.log(this.state);
      }
      window.clearInterval(this.state.timer);
      this.setState({
        startTime: null,
        timer: null
      });
    }
  }
  log(state) {
    console.log(`LOG: task: ${state.taskId} startTime: ${state.startTime} timeElapsed: ${state.timeElapsed}`);
  }
  
}

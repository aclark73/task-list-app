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
      taskLabel: '-',
      startTime: null,
      timeElapsed: 0,
      timeRemaining: 0,
      workTime: 60*5,
      breakTime: 60,
      timer: null,
      log: [],
      messages: []
    };
  }
  loadRedmine() {
    const parser = new RedmineTaskParser();
    parser.load().then( (projects) => {
      this.setState({projects: projects});
    }, (err) => {
      this.setState({
        messages: this.state.messages.concat(['' + err])
      });
    });
  }
  refresh() {
    console.log("refresh");
    this.loadRedmine();
  }
  handleRowClick(row) {
    console.log("Clicked on row: " + row);
  }
  formatTime(t) {
    var s = t%60;
    var m = (Math.trunc(t/60)%60);
    var h = Math.trunc(t/3600);

    function pad2(d) {
      return (d >= 10 ? '' : '0') + d;
    }

    if (h > 0) {
      return '' + h + ':' + pad2(m) + ':' + pad2(s);
    } else {
      return '' + m + ':' + pad2(s);
    }
  }
  getTask(taskId) {
    var foundTask = null;
    function findTask(task) {
      if (task && Task.getUID(project) == taskId) {
        foundTask = task;
        return true;
      }
    }
    this.state.projects.some( (project) => {
      return findTask(project) ||
        project.tasks.some( (task) => {
          return findTask(task);
        });
    });
    return foundTask;
  }
  render() {
    const context = {
      setTask: this.setTask.bind(this),
      refresh: this.refresh.bind(this),
      start: this.start.bind(this),
      compactView: this.compactView.bind(this),
      selectedTaskId: this.state.taskId,
      isRunning: !!(this.state.timer)
    };

    const rows = [];
    this.state.projects.forEach( (project) => {
      rows.push(<ProjectWidget key={Task.getUID(project)} task={project} context={context} />);
    });
    const logRows = []
    this.state.log.forEach( (logEntry, i) => {
      logRows.push(<li key={i}>{logEntry.taskLabel}</li>);
    });
    const messageRows = []
    this.state.messages.forEach( (message, i) => {
      messageRows.push(<li key={i}>{message}</li>);
    });
    const timeElapsed = this.formatTime(this.state.timeElapsed);
    const timeRemaining = this.formatTime(this.state.timeRemaining);
    const className = (this.state.timer ? 'running' : '');
    const currentTask = this.state.taskLabel;
    const tasksClassName = 'tasks' + (this.state.compactView ? ' compact' : '');
    const compactButtonClassName = 'fa fa-toggle-' + (this.state.compactView ? 'down' : 'up');
    return(
      <div className={className}>
        <div><label>Remaining:</label><span className="time-remaining">{timeRemaining}</span></div>
        <div><label>Elapsed:</label><span className="time-elapsed">{timeElapsed}</span></div>
        <div><label>Current:</label><span className="current-task">{currentTask}</span></div>
        <div className="btns">
          <span className="btn" onClick={context.refresh}><i className="fa fa-refresh"></i></span>
          <span className="btn" onClick={context.compactView}><i className={compactButtonClassName}></i></span>
          <span className="btn" onClick={context.compactView}><i className="fa fa-exclamation-triangle"></i></span>
          <span className="btn" onClick={context.compactView}><i className="fa fa-history"></i></span>
        </div>
        <div className="messages"><ul>{messageRows}</ul></div>
        <div className="log"><ul>{logRows}</ul></div>
        <div className={tasksClassName}><ul>{rows}</ul></div>
      </div>
    );
  }
  setTask(task) {
    const taskId = Task.getUID(task);
    const taskLabel = Task.getLabel(task);
    if (taskId != this.state.taskId) {
      console.log("setTask: " + taskId);
      this.stop();
      this.setState({
        taskId: taskId,
        taskLabel: taskLabel,
        timeElapsed: 0,
        timeRemaining: 0
      });
    }
  }
  compactView() {
    this.setState({
      compactView: !this.state.compactView
    });
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
    this.setState({
      log: this.state.log.concat([state])
    });
    const startTime = state.startTime.toISOString();
    console.log(`LOG: task: ${state.taskId} startTime: ${startTime} timeElapsed: ${state.timeElapsed}`);
  }

}

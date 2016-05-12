import React, { Component } from 'react';
import RedmineTaskParser from './redmine';
import Task from './task';
import { TaskWidget, ProjectWidget } from './widgets';
import classNames from 'classnames';

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
      compactView: false,
      workTime: 60,
      breakTime: 60,
      alertTime: 60,

      projects: [],
      tasks: [],

      taskId: null,
      taskLabel: '-',
      startTime: null,
      timeElapsed: 0,
      timeRemaining: 0,
      currently: 'stopped',
      timer: null,

      log: [],
      showLog: false,
      messages: [],
      showMessages: false,
      
      alertMessage: "",
      showAlert: false,
      afterWaiting: null
    };
  }
  addMessage(message) {
    this.setState({
      messages: this.state.messages.concat(['' + message])
    });
  }
  loadRedmine() {
    const parser = new RedmineTaskParser();
    parser.load().then( (data) => {
      this.setState({projects: data.projects, tasks: data.tasks});
    }, (err) => {
      this.addMessage(err);
    });
  }
  refresh() {
    this.addMessage("Loading Redmine");
    console.log("refresh");
    this.loadRedmine();
  }
  handleRowClick(row) {
    console.log("Clicked on row: " + row);
  }
  formatTime(t) {
    var neg = (t < 0);
    t = Math.abs(t);
    var s = t%60;
    var m = (Math.trunc(t/60)%60);
    var h = Math.trunc(t/3600);

    function pad2(d) {
      return (d >= 10 ? '' : '0') + d;
    }

    var sign = neg ? '-' : '';
    if (h > 0) {
      return sign + h + ':' + pad2(m) + ':' + pad2(s);
    } else {
      return sign + m + ':' + pad2(s);
    }
  }
  getTask(taskId) {
    var foundTask = null;
    function findTask(task) {
      if (task && Task.getUID(task) == taskId) {
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
    const actions = {
      start: this.start.bind(this),
      stop: this.stop.bind(this),
      pause: this.pause.bind(this),
      setTask: this.setTask.bind(this),
      refresh: this.refresh.bind(this),
      toggleCompactView: this.toggleCompactView.bind(this),
      showLog: this.showLog.bind(this),
      showMessages: this.showMessages.bind(this),
      dismissPopups: this.dismissPopups.bind(this)
    };
    const context = {
      selectedTaskId: this.state.taskId,
      currently: this.state.currently,
      actions: {
        setTask: actions.setTask,
        start: actions.start
      }
    };

    const rows = [];
    this.state.projects.forEach( (project) => {
      rows.push(<ProjectWidget key={Task.getUID(project)} task={project} context={context} />);
    });
    const logRows = []
    this.state.log.forEach( (logEntry, i) => {
      logRows.push(<li key={i}>{logEntry}</li>);
    });
    const messageRows = []
    this.state.messages.forEach( (message, i) => {
      messageRows.push(<li key={i}>{message}</li>);
    });
    const timeElapsed = this.formatTime(this.state.timeElapsed);
    const timeRemaining = this.formatTime(this.state.timeRemaining);
    const className = classNames(
      'main',
      this.state.currently,
      {
       'compact': this.state.compactView,
       'show-backdrop': (this.state.showLog || this.state.showMessages || this.state.showAlert),
       'show-log': this.state.showLog,
       'show-messages': this.state.showMessages,
       'show-alert': this.state.showAlert
      });
    const currentTask = this.state.taskLabel;
    const compactButtonClassName = classNames(
      'fa',
      {
        'fa-toggle-down': !this.state.compactView,
        'fa-toggle-up': this.state.compactView
      });
    return(
      <div className={className}>
        <div>
          <div className="btns">
            <span className="btn" onClick={actions.refresh}><i className="fa fa-refresh"></i></span>
            <span className="btn" onClick={actions.toggleCompactView}><i className={compactButtonClassName}></i></span>
            <span className="btn" onClick={actions.showMessages}><i className="fa fa-exclamation-triangle"></i></span>
            <span className="btn" onClick={actions.showLog}><i className="fa fa-history"></i></span>
          </div>
          <div className="popup messages"><ul><li className="header">Messages</li>{messageRows}</ul></div>
          <div className="popup log"><ul><li className="header">History</li>{logRows}</ul></div>
          <div className="popup alert"><ul><li className="header">Alert</li><li>{this.state.alertMessage}</li></ul></div>
        </div>
        <div className="timer-btn timer-btn-task" onClick={actions.pause}>
          <div className="time-remaining"><span>{timeRemaining}</span></div>
          <div className="current-task"><label>Task:</label><span>{currentTask}</span></div>
          <div className="time-elapsed"><label>Elapsed:</label><span>{timeElapsed}</span></div>
        </div>
        <div className="timer-btn timer-btn-stop" onClick={actions.stop}>
          Stop
        </div>
        <div className="tasks"><ul>{rows}</ul></div>
        <div className="backdrop" onClick={actions.dismissPopups}></div>
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
  toggleCompactView() {
    this.setState({
      compactView: !this.state.compactView
    });
  }
  showLog() {
    this.setState({
      showLog: true
    });
  }
  showMessages() {
    this.setState({
      showMessages: true
    });
  }
  dismissPopups() {
    this.setState({
      showLog: false,
      showMessages: false,
      showAlert: false
    });
    if (this.state.afterWaiting) {
      this.afterWaiting(this.state.afterWaiting);
    }
  }
  afterWaiting(next) {
    const timerPeriod = (next == "working") ? this.state.workTime : (
      (next == "paused") ? this.state.breakTime : 0);
    this.setState({
      currently: next,
      afterWaiting: null,
      timeRemaining: timerPeriod || 0
    });
    if (timerPeriod) {
      this.startTimer();
    }
  }
  waitForUser(message, next) {
    this.setState({
      showAlert: true,
      alertMessage: message,
      timeRemaining: this.state.alertTime,
      afterWaiting: next
    });
  }
  /* Timer */
  start(task) {
    if (task && !task.source) { task = null; }
    const changedTask = (task && Task.getUID(task) != this.state.taskId);
    if (changedTask) {
      this.setTask(task);
    }
    else if (this.state.currently == "working") {
      console.log("extend");
      // Don't interfere with timer, just reset the remaining time
      this.setState({
        timeRemaining: this.state.workTime
      });
      return;
    }
    if (!task || !Task.getUID(task)) { return; }
    this.setState({
      currently: "working",
      startTime: new Date(),
      timeRemaining: this.state.workTime
    });
    this.startTimer();
  }
  tick() {
    if (this.state.timer) {
      if (this.state.currently == "working") {
        this.setState({
          timeElapsed: this.state.timeElapsed + 1,
        });
      }
      this.setState({
        timeRemaining: this.state.timeRemaining - 1
      });
      if (this.state.timeRemaining <= 0) {
        this.timeUp();
      }
    }
  }
  timeUp() {
    this.stopTimer();
    switch (this.state.currently) {
      case "working":
        this.waitForUser("Time for a break!", "paused");
        break;
      case "paused":
        this.waitForUser("Ready to go!", "working");
        break;
    }
  }
  startTimer() {
    this.stopTimer();
    var tick = this.tick.bind(this);
    this.setState({
      timer: window.setInterval(tick, 1000)
    });
  }
  stopTimer() {
    if (this.state.timer) {
      window.clearInterval(this.state.timer);
    }
    this.setState({
      timer: null
    });
  }
  pause() {
    if (! this.state.taskId) { return; }
    if (this.state.currently == "working") {
      this.setState({
        currently: "paused",
        timeRemaining: this.state.breakTime
      });
      this.startTimer();
    } else {
      this.start(this.getTask(this.state.taskId));
    }
  }
  stop() {
    if (this.state.currently == "stopped") {
      return;
    }
    if (this.state.startTime) {
      this.log(this.state);
    }
    this.stopTimer();
    this.setState({
      currently: "stopped",
      timeRemaining: 0,
      timeElapsed: 0,
      startTime: null,
      timer: null
    });
  }
  log(state) {
    const startTime = this.state.startTime ? this.state.startTime.toISOString() : "?";
    this.setState({
      log: this.state.log.concat([`task: ${state.taskId} startTime: ${startTime} timeElapsed: ${state.timeElapsed}`])
    });
    console.log(`LOG: task: ${state.taskId} startTime: ${startTime} timeElapsed: ${state.timeElapsed}`);
  }

}

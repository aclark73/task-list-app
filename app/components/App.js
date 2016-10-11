import React, { Component } from 'react';
import RedmineClient from './redmine';
import GitHubClient from './github';
import Task from './task';
import { TaskWidget, ProjectWidget } from './widgets';
import classNames from 'classnames';
import Configstore from 'configstore';
import { LogChart } from './chart';
import Log from './log';
import TaskList from './tasklist';
import Utils from './utils';
// import pkg from '../../package.json';
const pkg = {name: 'task-list-app'};

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      workTime: 30*60,
      breakTime: 60,
      alertTime: 60,
      idleTime: 6,
      rewindTime: 10,

      projects: [],
      tasks: [],

      view: 'projects',
      compactView: false,
      pinnedTasks: [],
      
      taskId: null,
      taskLabel: '-',
      startTime: null,
      lastWorkTime: null,
      timeElapsed: 0,
      timeRemaining: 0,
      timeIdle: 0,
      currently: 'stopped',
      timer: null,

      log: [],
      showLog: false,
      showChart: false,
      messages: [],
      showMessages: false,
      
      alertMessage: "",
      showAlert: false,
      afterWaiting: null
    };
    this.actions = {
      click: this.click.bind(this),
      start: this.start.bind(this),
      stop: this.stop.bind(this),
      pause: this.pause.bind(this),
      rewind: this.rewind.bind(this),
      setTask: this.setTask.bind(this),
      refresh: this.refresh.bind(this),
      save: this.save.bind(this),
      uploadLogs: this.uploadLogs.bind(this),
      toggleView: this.toggleView.bind(this),
      toggleCompactView: this.toggleCompactView.bind(this),
      showLog: this.showLog.bind(this),
      showChart: this.showChart.bind(this),
      showMessages: this.showMessages.bind(this),
      dismissPopups: this.dismissPopups.bind(this),
      pinTask: this.pinTask.bind(this),
      unpinTask: this.unpinTask.bind(this),
    };
    this.conf = new Configstore(pkg.name);
  }
  componentWillMount() {
    this.load().then(this.refresh.bind(this)).then(this.stop.bind(this));
  }
  componentWillUnmount() {
    this.stop();
    this.save();
  }
  addMessage(message) {
    this.setState({
      messages: this.state.messages.concat(['' + message])
    });
  }
  click() {
    this.setState({
      timeIdle: 0
    });
  }
  save() {
    console.log("Saving to conf");
    this.conf.set('log', this.state.log);
  }
  load() {
    let log = this.conf.get('log');
    if (log) {
      log.sort(function(a, b) {
        const as = a.startTime;
        const bs = b.startTime;
        if (as < bs) { return 1; }
        else if (as > bs) { return -1; }
        else { return 0; }
      });
      this.setState({
        log: log
      });
    }
    return Promise.resolve();
  }
  uploadLogs() {
    const redmine = new RedmineClient();
    redmine.upload(this.state.log).then( (updatedLog) => {
      console.log("Redmine uploaded");
      this.setState({log: updatedLog});
      this.save();
    }, (err) => {
      console.log("Error! " + err);
    });
  }
  refresh() {
    this.addMessage("Loading Redmine");
    console.log("refresh");

    const redmine = new RedmineClient();
    const github = new GitHubClient();
    
    const projects = [];
    const tasks = [];
    return redmine.load().then( (data) => {
      Array.prototype.push.apply(projects, data.projects);
      Array.prototype.push.apply(tasks, data.tasks);
    }).then( () => {
      this.setState({projects: projects, tasks: tasks});
    });
    /*
    return Promise.all([
      redmine.load(),
      github.load()
    ]).then( (data) => {
      var projects = [].concat(data[0].projects, data[1].projects);
      var tasks = [].concat(data[0].tasks, data[1].tasks);
      this.setState({projects: projects, tasks: tasks});
    }, (err) => {
      this.addMessage(err);
    });
    */
  }
  handleRowClick(row) {
    console.log("Clicked on row: " + row);
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
    // All the available callbacks from the UI
    const actions = this.actions;
    // Context provided to children (eg. task widgets)
    const context = {
      selectedTaskId: this.state.taskId,
      currently: this.state.currently,
      actions: actions,
      view: this.state.view
    };

    const taskList = (
      <TaskList projects={this.state.projects} tasks={this.state.tasks}
        pinnedTasks={this.state.pinnedTasks}
        context={context} />
    );

    const logDisplay = (
      <Log log={this.state.log}/>
    );
    const logChart = (
      <LogChart log={this.state.log}/>
    );

    const messageRows = []
    this.state.messages.forEach( (message, i) => {
      messageRows.push(
        <li key={i}>{message}</li>
      );
    });
    const startTime = Utils.getTime(this.state.startTime);
    const timeElapsed = Utils.formatTimespan(this.state.timeElapsed);
    const timeRemaining = Utils.formatTimespan(this.state.timeRemaining);
    var idleLevel = '';
    if (this.state.timeIdle > 5) { idleLevel = 'idle-1'; }
    if (this.state.timeIdle > 10) { idleLevel = 'idle-2'; }
    
    const className = classNames(
      'main',
      this.state.currently,
      idleLevel,
      {
       'has-task': this.state.taskId,
       'compact': this.state.compactView,
       'show-popup': (this.state.showLog || this.state.showChart || this.state.showMessages || this.state.showAlert),
       'show-log': this.state.showLog,
       'show-timeline': this.state.showChart,
       'show-messages': this.state.showMessages,
       'show-alert': this.state.showAlert
      });
    const currentTask = this.state.taskLabel;
    const compactButtonClassName = classNames(
      'fa',
      (this.state.compactView ? 'fa-toggle-up' : 'fa-toggle-down')
      );
    
    const toolbar = (
      <div className="toolbar">
        <div className="btns">
          <span className="btn" title="Refresh task list" onClick={actions.refresh}>
            <i className="fa fa-refresh"></i> Reload</span>
        </div>
        <div className="btns">
          <span className="btn" title="Show log" onClick={actions.showLog}>
            <i className="fa fa-calendar"></i> Log</span>
          <span className="btn" title="Upload logged time" onClick={actions.uploadLogs}>
            <i className="fa fa-database"></i> Upload</span>
        </div>
        <div className="btns">
          <span className="btn" title="Show chart" onClick={actions.showChart}>
            <i className="fa fa-area-chart"></i> Debug</span>
          <span className="btn" title="Show debug messages" onClick={actions.showMessages}>
            <i className="fa fa-exclamation-triangle"></i> Debug</span>
          <span className="btn" title="Toggle group by project" onClick={actions.toggleView}>
            <i className="fa fa-list"></i> Group</span>
          <span className="btn" title="Toggle compact view" onClick={actions.toggleCompactView}>
            <i className="fa fa-arrows-v"></i> Compact</span>
        </div>
      </div>
    );
    const popups = (
      <div>
        <div className="popup-backdrop"></div>
        <div className="popup-click" onClick={actions.dismissPopups}></div>
        <div className="popup messages"><ul><li className="header">Messages</li>{messageRows}</ul></div>
        <div className="popup log"><ul><li className="header">Log</li>{logDisplay}</ul></div>
        <div className="popup chart"><ul><li className="header">Log Chart</li>{logChart}</ul></div>
        <div className="popup alert"><ul><li className="header">Alert</li><li>{this.state.alertMessage}</li></ul></div>
      </div>
    );
    return(
      <div className={className} onClick={actions.click}>
        {toolbar}
        <div className="timer-btns-side">
          <div className="btn timer-btn timer-btn-stop" onClick={actions.stop}>
            Stop
          </div>
          <div className="btn timer-btn timer-btn-rewind" onClick={actions.rewind}>
            Rewind
          </div>
        </div>
        <div className="btn timer-btn timer-btn-task" onClick={actions.pause}>
          <div className="time-remaining"><span>{timeRemaining}</span></div>
          <div className="current-task">
            <label>Task</label><span>{currentTask}</span>
          </div>
          <div className="start-time">
            <label>Started</label><span>{startTime}</span>
          </div>
          <div className="time-elapsed">
            <label>Elapsed</label><span>{timeElapsed}</span>
          </div>
        </div>
        
        <div className="task-list"><ul className={this.state.view}>{taskList}</ul></div>

        {popups}
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
  toggleView() {
    this.setState({
      view: (this.state.view == 'projects' ? 'tasks' : 'projects')
    });
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
  showChart() {
    this.setState({
      showChart: true
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
      showChart: false,
      showMessages: false,
      showAlert: false
    });
    if (this.state.afterWaiting) {
      this.afterWaiting(this.state.afterWaiting);
    }
  }
  pinTask(taskId) {
    const pinnedTasks = this.state.pinnedTasks;
    this.setState({
      pinnedTasks: pinnedTasks.concat([taskId])
    });
  }
  unpinTask(taskId) {
    const pinnedTasks = this.state.pinnedTasks;
    const idx = pinnedTasks.indexOf(taskId);
    if (idx > -1) {
      // Make a copy
      const pinnedTasks2 = pinnedTasks.slice();
      pinnedTasks2.splice(idx, 1);
      this.setState({
        pinnedTasks: pinnedTasks2
      });
    }
  }
  afterWaiting(next) {
    const timerPeriod = ({
      working: this.state.workTime,
      paused: this.state.breakTime,
      stopped: 0
    })[next];
    this.setState({
      currently: next,
      afterWaiting: null,
      timeRemaining: timerPeriod
    });
    this.stopTimer();
    if (timerPeriod) {
      this.startTimer();
    }
  }
  waitForUser(message, next) {
    this.setState({
      showAlert: true,
      alertMessage: message,
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
      startTime: this.state.startTime || new Date(),
      timeRemaining: this.state.workTime
    });
    this.startTimer();
  }
  tick() {
    const state = {};
    if (this.state.currently == "stopped" || this.state.showAlert) {
      state.timeIdle = this.state.timeIdle + 1;
    }
    else if (this.state.currently == "working") {
      state.timeElapsed = this.state.timeElapsed + 1;
      state.lastWorkTime = new Date();
    }
    if (this.state.timeRemaining > 0) {
      state.timeRemaining = this.state.timeRemaining - 1;
    }
    this.setState(state);
    if (state.timeRemaining === 0) {
      this.timeUp();
    }
  }
  timeUp() {
    switch (this.state.currently) {
      case "working":
        this.waitForUser("Time for a break!", "paused");
        break;
      case "paused":
        this.waitForUser("Ready to go!", "paused");
        break;
      case "stopped":
        this.waitForUser("Hello!", "stopped");
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
      this.setState({
        timer: null
      });
    }
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
    if (this.state.startTime) {
      this.log();
    }
    this.setState({
      currently: "stopped",
      timeRemaining: 0,
      timeElapsed: 0,
      startTime: null,
    });
    this.startTimer();
  }
  rewind() {
    if (this.state.startTime) {
      this.setState({
        startTime: new Date(this.state.startTime - 1000*60*this.state.rewindTime),
        timeElapsed: this.state.timeElapsed + 60*this.state.rewindTime
      });
    }
  }
  log() {
    const task = this.getTask(this.state.taskId);
    const logEntry = {
      taskId: this.state.taskId,
      taskName: Task.getLabel(task), 
      startTime: this.state.startTime.toISOString(),
      endTime: this.state.lastWorkTime.toISOString(),
      timeElapsed: this.state.timeElapsed
    }
    this.setState({
      log: [logEntry].concat(this.state.log)
    }, (err) => {
      if (!err) { this.save(); }
    });
    const logEntryStr = JSON.stringify(logEntry);
    console.log(`LOG: task: ${logEntryStr}`);
  }

}

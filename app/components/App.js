import React, { Component } from 'react';
import RedmineClient from './redmine';
import GitHubClient from './github';
import Task from './task';
import { TaskWidget, ProjectWidget } from './widgets';
import classNames from 'classnames';
import Configstore from 'configstore';
// import { LogChart } from './chart';
import Log from './log';
import TaskList from './tasklist';
import Utils from './utils';
// import pkg from '../../package.json';
const pkg = {name: 'task-list-app'};

export default class App extends Component {
  constructor(props) {
    super(props);
    window.app = this;
    this.state = {
      workTime: 30*60,
      breakTime: 60,
      alertTime: 60,
      idleTime: 6,
      rewindTime: 10,

      projects: [],
      tasks: [],
      
      localTasks: [],

      view: 'projects',
      compactView: false,
      
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
      dismissPopups: this.dismissPopups.bind(this)
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
    //this.setState({
    //  timeIdle: 0
    //});
  }
  save() {
    console.log("Saving to conf");
    this.conf.set('log', this.state.log);
    this.conf.set('localTasks', this.state.localTasks);
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
      log.forEach(function(logEntry) {
        if (!logEntry.taskId) {
          logEntry.taskId = logEntry.task;
        }
      });
      this.setState({
        log: log
      });
    }
    let localTasks = this.conf.get('localTasks');
    if (localTasks) {
      this.setState({
        localTasks: localTasks
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
    const requests = [redmine, github].map((client) => {
      return client.load().then(
        (data) => {
          Array.prototype.push.apply(projects, data.projects);
          Array.prototype.push.apply(tasks, data.tasks);
        },
        (err) => {
          console.log("Error in client: " + err);
        }
      );
    });
    return Promise.all(requests).then(
      () => {
        this.setState({projects: projects, tasks: tasks});
      },
      (err) => {
        console.log(err);
      }
    );
  }
  sortTasks(projects, tasks) {
    const lastWork = Utils.lastWorkPerTask(this.state.log);
    tasks.forEach((task) => {
      const uid = Task.getUID(task);
      if (lastWork[uid] && lastWork[uid] > task.updated_on) {
        task.updated_on = lastWork[uid];
      }
    });
    function taskSort(t1, t2) {
      if (t2.updated_on > t1.updated_on) { return 1; }
      else if (t1.updated_on > t2.updated_on) { return -1; }
      else { return 0; }
    }
    tasks.sort(taskSort);
  }
  handleRowClick(row) {
    console.log("Clicked on row: " + row);
  }
  getTask(taskId) {
    var foundTask = null;
    // Function to check whether a given task matches
    function matches(task) {
      if (task && Task.getUID(task) == taskId) {
        foundTask = task;
        return true;
      }
    }
    // Run the function across all tasks until found
    this.state.projects.some( (project) => {
      return matches(project) ||
        project.tasks.some( (task) => {
          return matches(task);
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
        context={context} />
    );

    const logDisplay = (
      <Log log={this.state.log}/>
    );
    const logChart = '';
    //  <LogChart log={this.state.log}/>

    const messageRows = []
    this.state.messages.forEach( (message, i) => {
      messageRows.push(
        <li key={i}>{message}</li>
      );
    });
    const startTime = Utils.getTime(this.state.startTime);
    const timeElapsed = Utils.formatTimespan(this.state.timeElapsed);
    const isIdle = (!this.state.timeRemaining && this.state.timeIdle);
    const timeRemaining = Utils.formatTimespan(this.state.timeRemaining);
    const timeIdle = (this.state.timeIdle > 0) ? "Idle: " + Utils.formatTimespan(this.state.timeIdle) : '';
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
    
    function makeButton(action, label, glyphicon, title) {
      return (
          <span className="btn" title={title} onClick={action}>
            <i className={glyphicon}></i>
            <span className="btn-label"> {label}</span></span>
      );
    }
    
    const toolbar = (
      <div className="toolbar">
        <div className="btns btn-lg">
          {makeButton(actions.refresh, 'Refresh', 'fa fa-refresh', 'Refresh task list')}
        </div>
        <div className="btns btn-lg">
          {makeButton(actions.showLog, 'Log', 'fa fa-calendar', 'Show log')}
          {makeButton(actions.uploadLogs, 'Upload', 'fa fa-database', 'Upload logged time')}
        </div>
        <div className="btns btn-sm">
          {makeButton(actions.showMessages, 'Debug', 'fa fa-exclamation-triangle', 'Show debug messages')}
          {makeButton(actions.toggleView, 'Group', 'fa fa-list', 'Toggle group by project')}
          {makeButton(actions.toggleCompactView, 'Compact', 'fa fa-arrows-v', 'Toggle compact view')}
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
          <div className="times">
            <div className="start-time">
              <label>Started</label><div clasName="time">{startTime}</div>
            </div>
            <div className="time-elapsed">
              <label>Elapsed</label><div className="time">{timeElapsed}</div>
            </div>
          </div>
          <div>
            <span className="time-remaining">{timeRemaining}</span>
            <span className="time-idle">{timeIdle}</span>
          </div>
          <div className="current-task">
            {currentTask}
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
    // Pause timer and show the message to the user. When the user
    // dismisses the dialog, go to the specified next state.
    this.setState({
      showAlert: true,
      alertMessage: message,
      afterWaiting: next,
      timeIdle: 0
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
      timeRemaining: this.state.workTime,
      timeIdle: 0
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
      // Check for long gap (system sleep?)
      const now = new Date();
      if (state.lastWorkTime) {
        const gap = now - state.lastWorkTime();
        console.log("Gap is " + gap);
        if (gap > 60000) {
          console.log("Stopping due to time gap of " + gap);
          this.waitForUser("Stopping due to time gap of " + gap, "stopped");
          return;
        }
      }
      state.lastWorkTime = now;
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
        timeRemaining: this.state.breakTime,
        timeIdle: 0
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
      timeIdle: 0
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

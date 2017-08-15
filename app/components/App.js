import React, { Component } from 'react';
import Task from './task';
import TaskList from './tasklist';
import { TaskWidget, ProjectWidget } from './widgets';
import Utils from './utils';
import Toolbar from './toolbar';

import classNames from 'classnames';
import Configstore from 'configstore';

import RedmineClient from './lib/redmine';
import GitHubClient from './lib/github';
// import { LogChart } from './lib/chart';
import Log from './lib/log';
import StatusHandler from './lib/status';
import LocalTasksHandler from './lib/local';

// import pkg from '../../package.json';
const pkg = {name: 'task-list-app'};

export default class App extends Component {
  constructor(props) {
    super(props);
    window.app = this;

    this.state = {
      // Config
      workTime: 30*60,
      breakTime: 60,
      alertTime: 60,
      idleTime: 0,
      rewindTime: 10*60,

      // Main data: projects and tasks
      projects: [],
      tasks: [],

      localTasks: [],

      // UI toaggles
      view: 'tasks',
      compactView: false,

      // CUrrent task
      task: null,
      taskId: null,
      taskLabel: '-',
      taskIssueNumber: null,

      // Ticking clock
      startTime: null,
      lastWorkTime: null,
      timeElapsed: 0,
      timeRemaining: 0,
      timeIdle: 0,
      currently: 'stopped',
      timer: null,

      // Log
      log: [],
      messages: [],

      // Popup
      popup: '',
      alertMessage: "",
      showAlert: false,
      afterWaiting: null
    };
    this.actions = {
      click: this.click.bind(this),
      start: this.start.bind(this),
      stop: this.stop.bind(this),
      startStop: this.startStop.bind(this),
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
      showPopup: {}
    };

    /* Pluggable handlers */
    this.handlers = {};
    this.handlerList = [];
    this.registerHandler(new StatusHandler('status', this));

    this.conf = new Configstore(pkg.name);
  }
  /* Add a pluggable handler */
  registerHandler(handler) {
    // Add to list
    this.handlerList.push(handler);
    // Lookup by name
    this.handlers[handler.label] = handler;
    // Handler state in a namespace
    this.state[handler.label] = handler.initialState();
    // Register any popup handler
    if (handler.popup) {
      this.actions.showPopup[handler.label] = () => {
        this.showPopup(handler.label);
      }
    }
  }
  componentWillMount() {
    this.load() // Load data
    .then(this.refresh.bind(this)) // Refresh UI
    .then(this.startup.bind(this)); // Stop everything
  }
  componentWillUnmount() {
    console.log("unmount");
    this.stop();
    this.save();
  }
  addMessage(message) {
    this.setState({
      status: this.handlers.status.addMessage(this.state.status, message)
      // messages: this.state.messages.concat(['' + message])
    });
  }
  click() {
    //this.setState({
    //  timeIdle: 0
    //});
  }
  save() {
    console.log("Saving to conf");
    [
      'log', 'view', 'compactView'
    ].forEach( (f) => {
      this.conf.set(f, this.state[f]);
    });
    this.conf.set(
      'tempLog',
      (this.state.currently == 'working') ? this.createLogEntry() : null);
  }
  load() {
    console.log("Loading from conf");
    const state = {};
    [
      'log', 'view', 'compactView'
    ].forEach( (f) => {
      state[f] = this.conf.get(f) || this.state[f];
    });
    this.fixLog(state);

    this.handleTempLog(state, this.conf.get('tempLog'));

    this.setState(state);

    const sourcesConf = this.conf.get('sources') || {};
    this.sources = [
      new RedmineClient(sourcesConf.redmine),
      new GitHubClient(sourcesConf.github)
    ];
    return Promise.resolve();
  }
  /** DELETE - THESE SHOULD BE IN LOG **/
  fixLog(state) {
    function getDurationMS(t1, t2) {
      try {
        const duration = Math.floor((new Date(t2) - new Date(t1)));
        if (isNaN(duration)) {
          throw "NaN!";
        }
        // console.log("" + t2 + " - " + t1 + " = " + duration);
        return duration;
      }
      catch (e) {
        console.log("" + t1 + " - " + t2 + " = " + e);
        return 0;
      }
    }
    if (state.log) {
      // Truncate long entries
      state.log.forEach(function(entry) {
        if (getDurationMS(entry.startTime, entry.endTime) > 6*60*60*1000) {
          entry.endTime = (new Date(
            (new Date(entry.startTime)).getTime() + entry.timeElapsed*60*1000
          )).toISOString();
        }
      });
      // Make sure logs are sorted (user edits can unsort them)
      state.log.sort(function(a, b) {
        const as = a.startTime;
        const bs = b.startTime;
        if (as < bs) { return 1; }
        else if (as > bs) { return -1; }
        else { return 0; }
      });
    }
  }
  handleTempLog(state, tempLog) {
    if (tempLog) {
      state.log = [tempLog].concat(state.log);
      const outage = (new Date()) - (new Date(tempLog.endTime));
      console.log("Last activity was " + tempLog.endTime + " (" + outage + ")");
      if (outage < 2*60*1000) {
        state.resumeTaskId = tempLog.taskId;
      }
    }
  }
  uploadLogs() {
    /* TODO: this is a hack to find the Redmine client */
    const redmine = this.sources.filter((client) => {
      return client.source == 'redmine';
    })[0];
    redmine.upload(this.state.log).then( (updatedLog) => {
      console.log("Redmine uploaded");
      this.setState({log: updatedLog});
      this.save();
    }, (err) => {
      console.log("Error! " + err);
    });
  }
  /* END DELETE */
  refresh() {
    this.addMessage("Refreshing task data");
    console.log("refresh");

    const projects = [];
    const tasks = [];
    const requests = this.sources.map((client) => {
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
        // Check to see if the current task has disappeared
        const found = tasks.find((task) => {
            return Task.getUID(task) == this.state.taskId;
        });
        if (!found) {
            this.stop();
        }
        this.sortTasks(projects, tasks);
        Task.setProjectColors(projects, tasks);
        this.setState({projects: projects, tasks: tasks});
      },
      (err) => {
        console.log(err);
      }
    );
  }
  sortTasks(projects, tasks) {
    // The task's updated_on should be the last logged work if that's newer
    const lastWork = Utils.lastWorkPerTask(this.state.log);
    tasks.forEach((task) => {
      const uid = Task.getUID(task);
      if (lastWork[uid] && lastWork[uid] > task.updated_on) {
        task.updated_on = lastWork[uid];
      }
    });
    // Sort based on updated_on
    function taskSort(t1, t2) {
      if (t2.updated_on > t1.updated_on) { return 1; }
      else if (t1.updated_on > t2.updated_on) { return -1; }
      else { return 0; }
    }
    tasks.sort(taskSort);
  }
  startup() {
    if (this.state.resumeTaskId) {
      this.start(this.getTask(this.state.resumeTaskId));
      this.setState({resumeTaskId: null});
    } else {
      this.stop();
    }
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

    // Task/project list
    const taskList = (
      <TaskList projects={this.state.projects} tasks={this.state.tasks}
        context={context} />
    );

    // Contents of various popups
    const logPopupContents = (
      <Log log={this.state.log}/>
    );
    // Log chart dialog contents
    const logChartPopupContents = '';
    //  <LogChart log={this.state.log}/>

    // Status dialog contents
    const statusMessages = this.handlers.status.popup(this.state.status);

    const startTime = Utils.getTime(this.state.startTime);
    const timeElapsed = Utils.formatTimespan(this.state.timeElapsed);
    const isIdle = (!this.state.timeRemaining && this.state.timeIdle);
    const timeRemaining = Utils.formatTimespan(this.state.timeRemaining);
    const timeIdle = (this.state.timeIdle > 0) ? "Idle: " + Utils.formatTimespan(this.state.timeIdle) : '';
    var idleLevel = '';
    if (this.state.timeIdle > 5) { idleLevel = 'idle-1'; }
    if (this.state.timeIdle > 10) { idleLevel = 'idle-2'; }

    // Popup
    const popupClass = (this.state.popup) ?
      'show-' + this.state.popup :
      '';

    const className = classNames(
      'main',
      this.state.currently,
      idleLevel,
      popupClass,
      {
       'has-task': this.state.taskId,
       'compact': this.state.compactView,
       'show-popup': !!this.state.popup
      });
    const currentTask = this.state.taskLabel;
    const compactButtonClassName = classNames(
      'fa',
      (this.state.compactView ? 'fa-toggle-up' : 'fa-toggle-down')
      );

    /* Simple button definition
     * This should be moved elsewhere
     **/
    function makeButton(action, label, glyphicon, title) {
      return (
          <span className="btn" title={title} onClick={action}>
            <i className={glyphicon}></i>
            <span className="btn-label"> {label}</span></span>
      );
    }

    const handlerPopups = [];
    const handlerButtons = {};
    this.handlerList.forEach((h) => {
        const popupContents = h.popup(this.state[h.label]);
        handlerPopups.push((
          <div key={h.label} className={"popup popup-"+h.label}>{popupContents}</div>
        ));
    });

    const statusPopup = this.handlers.status.popup(this.state.status);
    const popups = (
      <div>
        <div className="popup-backdrop"></div>
        <div className="popup-click" onClick={actions.dismissPopups}></div>
        {statusPopup}
        <div className="popup log"><ul><li className="header">Log</li>{logPopupContents}</ul></div>
        <div className="popup alert"><ul><li className="header">Alert</li><li>{this.state.alertMessage}</li></ul></div>
      </div>
    );
    const issueNumber = this.state.taskIssueNumber ? '#' + this.state.taskIssueNumber : '';
    const statusMessage = this.handlers.status.component(this.state.status);
    const timer = (
      <div className="timer" onClick={actions.startStop} title="Click to start/stop">
        <div className="time-remaining">{timeRemaining}</div>
        <div className="current-task">
          {currentTask}
        </div>
        <div className="status">
          <div className="issue-number"><a>{issueNumber}</a></div>
          <div className="start-time">
            <span className="fa fa-clock-o"></span><span className="time">{startTime}</span>
          </div>
          <div className="time-elapsed" onClick={actions.rewind} title="Click to rewind">
            <span className="fa fa-hourglass-o"></span><span className="time">{timeElapsed}</span>
          </div>
          <div className="time-idle">{timeIdle}</div>
        </div>
      </div>
    );
    return(
      <div className={className} onClick={actions.click}>
        {statusMessage}
        <Toolbar actions={actions} handlers={this.handlers} />
        {timer}
        <div className="task-list">{taskList}</div>
        {popups}
      </div>
    );
  }
  setTask(task) {
    this.addMessage("Changed task");
    const taskId = Task.getUID(task);
    if (taskId != this.state.taskId) {
      console.log("setTask: " + taskId);
      this.stop();
      this.setState({
        taskId: taskId,
        task: task,
        taskLabel: Task.getLabel(task),
        taskIssueNumber: task.issue_number,
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
    this.showPopup('log');
  }
  showChart() {
    this.showPopup('chart');
  }
  showMessages() {
    this.showPopup('messages');
  }
  showPopup(popup) {
    this.setState({
      popup: popup
    });
  }
  dismissPopups() {
    this.setState({
      popup: ''
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

  /**
   * Pause timer and show the message to the user. When the user
   * dismisses the dialog, go to the specified next state.
   */
  waitForUser(message, next) {
    this.setState({
      popup: 'alert',
      alertMessage: message,
      afterWaiting: next,
      timeIdle: 0
    });
  }

  /* Start timer */
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
    const now = new Date();
    this.setState({
      currently: "working",
      startTime: this.state.startTime || now,
      lastWorkTime: now,
      timeRemaining: this.state.workTime,
      timeIdle: 0
    });
    this.startTimer();
  }
  /* Callback for timer ticks */
  tick() {
    // Check for long gap -- usually means a system sleep
    const now = new Date();
    if (this.state.lastWorkTime) {
      const gap = now - this.state.lastWorkTime + this.state.timeIdle;
      if (gap > 2000) {
        console.log("Gap is " + gap + ' at ' + new Date());
      }
      if (gap > 60000) {
        console.log("Stopping due to time gap of " + gap);
        this.stop();
        this.waitForUser("Stopping due to time gap of " + gap, "stopped");
        return;
      }
    }
    // Otherwise, ~1s has elapsed since the last tick(). Update accordingly.
    const state = {};
    if (this.state.currently == "stopped" || this.state.popup == "alert") {
      state.timeIdle = this.state.timeIdle + 1;
    }
    else if (this.state.currently == "working") {
      if (this.state.timeElapsed && !(this.state.timeElapsed % 60)) {
        this.save();
      }
      state.lastWorkTime = now;
      state.timeElapsed = this.state.timeElapsed + 1;
    }
    if (this.state.timeRemaining > 0) {
      state.timeRemaining = this.state.timeRemaining - 1;
    }
    this.updateHandlerStates(this.state, state);
    this.setState(state);
    if (state.timeRemaining === 0) {
      this.timeUp();
    }
  }
  updateHandlerStates(state) {
    this.handlerList.forEach((h) => {
      h.updateFullState(this.state, state);
    });
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
  startStop() {
    if (! this.state.taskId) { return; }
    if (this.state.currently == "working") {
      this.stop();
    } else {
      this.start(this.getTask(this.state.taskId));
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
  rewind(e) {
    e.stopPropagation();
    if (this.state.startTime) {
      const now = new Date();
      const totalTime = (now - this.state.startTime)/1000;
      const newState = {
        timeElapsed: this.state.timeElapsed + this.state.rewindTime
      };
      if (newState.timeElapsed > totalTime) {
        newState.startTime = new Date(now - newState.timeElapsed*1000);
      }
      this.setState(newState);
    }
  }
  createLogEntry() {
    const task = this.getTask(this.state.taskId);
    return {
      taskId: this.state.taskId,
      taskName: Task.getLabel(task),
      project: task.project,
      startTime: this.state.startTime.toISOString(),
      endTime: this.state.lastWorkTime.toISOString(),
      timeElapsed: this.state.timeElapsed
    };
  }
  maybeAppendLog(log, entry) {
    const prev = log[0];
    if (prev && prev.taskId == entry.taskId) {
      const outage = (new Date(entry.startTime)) - (new Date(prev.endTime));
      console.log("Previous log entry was " + prev.endTime + " (" + outage + ")");
      if (outage < 5*60*1000) {
        console.log("Revising previous log entry which ended " + prev.endTime + " (" + outage + " ms before)");
        const prevUpdate = prev;
        prevUpdate.endTime = entry.endTime;
        prevUpdate.timeElapsed += entry.timeElapsed;
        return [prevUpdate].concat(log.slice(1));
      }
    }
    // Remember this is ordered by descending time
    return [entry].concat(log);
  }
  log(logEntry) {
    if (!logEntry) {
      logEntry = this.createLogEntry();
    }
    // If this is a trivial extension of the previous entry,
    // simply combine them.
    var log = this.state.log;
    if (log) {
      log = this.maybeAppendLog(log, logEntry);
    }
    this.setState({
      log: log
    }, (err) => {
      if (!err) { this.save(); }
    });
    const logEntryStr = JSON.stringify(logEntry);
    console.log(`LOG: task: ${logEntryStr}`);
  }

}

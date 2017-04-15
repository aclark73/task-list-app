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
import StatusHandler from './status';
import Utils from './utils';
import ToolbarButton from './toolbar';
// import pkg from '../../package.json';
const pkg = {name: 'task-list-app'};

class Toolbar extends Component {
  render() {
    return (
      <div className="toolbar">
        <div className="btns btn-lg">
          <ToolbarButton label="Refresh" action={this.props.actions.refresh}
            icon="fa fa-refresh" title="Refresh task list" />
        </div>
        <div className="btns btn-lg">
          <ToolbarButton label="Log" action={this.props.actions.showLog}
            icon="fa fa-calendar" title="Show log" />
          <ToolbarButton label="Upload" action={this.props.actions.uploadLogs}
            icon="fa fa-database" title="Upload logged time" />
        </div>
        <div className="btns btn-sm">
          <ToolbarButton label="Status" action={this.props.actions.showPopup.status}
            icon="fa fa-exclamation-triangle" title="Show status messages" />
          <ToolbarButton label="Group" action={this.props.actions.toggleView}
            icon="fa fa-list" title="Toggle group by project" />
          <ToolbarButton label="Compact" action={this.props.actions.toggleCompactView}
            icon="fa fa-arrows-v" title="Toggle compact view" />
        </div>
      </div>
    );
  }
}

export default class App extends Component {
  constructor(props) {
    super(props);
    window.app = this;

    this.state = {
      workTime: 30*60,
      breakTime: 60,
      alertTime: 60,
      idleTime: 0,
      rewindTime: 10*60,

      projects: [],
      tasks: [],

      localTasks: [],

      view: 'tasks',
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
      messages: [],

      popup: '',

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
    .then(this.stop.bind(this)); // Stop everything
  }
  componentWillUnmount() {
    console.log("unmount");
    this.stop();
    this.save();
  }
  addMessage(message) {
    this.setState({
      status: this.handlers.status.addMessage(this.state.status, message),
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

    const tempLog = this.conf.get('tempLog');
    if (tempLog) {
      state.log = [tempLog].concat(state.log);
    }

    this.setState(state);

    const sourcesConf = this.conf.get('sources') || {};
    this.sources = [
      new RedmineClient(sourcesConf.redmine),
      new GitHubClient(sourcesConf.github)
    ];
    return Promise.resolve();
  }
  fixLog(state) {
    if (state.log) {
      state.log.sort(function(a, b) {
        const as = a.startTime;
        const bs = b.startTime;
        if (as < bs) { return 1; }
        else if (as > bs) { return -1; }
        else { return 0; }
      });
      state.log.forEach(function(logEntry) {
        if (!logEntry.taskId) {
          logEntry.taskId = logEntry.task;
        }
      });
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
        <div className="popup log"><ul><li className="header">Log</li>{logDisplay}</ul></div>
        <div className="popup chart"><ul><li className="header">Log Chart</li>{logChart}</ul></div>
        <div className="popup alert"><ul><li className="header">Alert</li><li>{this.state.alertMessage}</li></ul></div>
      </div>
    );
    const statusMessage = this.handlers.status.component(this.state.status);
    return(
      <div className={className} onClick={actions.click}>
        <Toolbar actions={actions} handlers={this.handlers} />
        <div className="timer-btns-side">
          <div className="btn timer-btn timer-btn-stop" onClick={actions.stop}>
            Stop
          </div>
          <div className="btn timer-btn timer-btn-rewind" onClick={actions.rewind}>
            Rewind
          </div>
        </div>
        <div className="btn timer-btn timer-btn-task" onClick={actions.pause}>
          {statusMessage}
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
    this.addMessage("Changed task");
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
    const state = {};
    if (this.state.currently == "stopped" || this.state.popup == "alert") {
      state.timeIdle = this.state.timeIdle + 1;
    }
    else if (this.state.currently == "working") {
      if (this.state.timeElapsed && !(this.state.timeElapsed % 60)) {
        this.save();
      }
      // Check for long gap (system sleep?)
      const now = new Date();
      if (this.state.lastWorkTime) {
        const gap = now - this.state.lastWorkTime;
        // console.log("Gap is " + gap + " (" + now + ")");
        if (gap > 60000) {
          console.log("Stopping due to time gap of " + gap);
          this.waitForUser("Stopping due to time gap of " + gap, "stopped");
          return;
        }
      }
      state.lastWorkTime = now;
      state.timeElapsed = this.state.timeElapsed + 1;
    }
    if (this.state.timeRemaining > 0) {
      state.timeRemaining = this.state.timeRemaining - 1;
    }
    this.updateHandlerState(state);
    this.setState(state);
    if (state.timeRemaining === 0) {
      this.timeUp();
    }
  }
  updateHandlerState(state) {
    this.handlerList.forEach((h) => {
      const hState = h.updateState(this.state[h.label]);
      if (hState) {
        state[h.label] = hState;
      }
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
  log(logEntry) {
    if (!logEntry) {
      logEntry = this.createLogEntry();
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

/**
 * Toolbar button
 */
import React, { Component } from 'react';
import Task from './task';
import Utils from './utils';


class ToolbarButton extends Component {
  renderInner(label, icon, action, title) {
    return (
      <span className="btn" title={title} onClick={action}>
        <i className={icon}></i>
        <span className="btn-label"> {label}</span>
      </span>
    );
  }
  render() {
    return this.renderInner(
        this.props.label, this.props.icon, 
        this.props.action, this.props.title);
  }
}

class IssueToolbarButton extends ToolbarButton {
    render() {
        const taskNumber = Task.getIssueNumber(this.props.currentTask);
        return this.renderInner(
            taskNumber, 
            "fa fa-database",
            this.props.actions.refresh,
            "Refresh"
        );
    }
}

class StartTimeToolbarButton extends ToolbarButton {
    render() {
        const startTime = Utils.getTime(this.props.startTime);
        return this.renderInner(
            startTime, 
            "fa fa-clock-o",
            this.props.actions.rewind,
            "Click to rewind"
        );
    }
}



export default class Toolbar extends Component {
  render() {
    return (
      <div className="toolbar">
        <div className="toolber-options">
          <div className="hamburger"><i className="fa fa-bars"></i></div>
          <div className="btns">
            <ToolbarButton label="Refresh" action={this.props.actions.refresh}
              icon="fa fa-refresh" title="Refresh task list" />
            <ToolbarButton label="Log" action={this.props.actions.showLog}
              icon="fa fa-calendar" title="Show log" />
            <ToolbarButton label="Upload" action={this.props.actions.uploadLogs}
              icon="fa fa-database" title="Upload logged time" />
            <ToolbarButton label="Status" action={this.props.actions.showPopup.status}
              icon="fa fa-exclamation-triangle" title="Show status messages" />
            <ToolbarButton label="Group" action={this.props.actions.toggleView}
              icon="fa fa-list" title="Toggle group by project" />
            <ToolbarButton label="Compact" action={this.props.actions.toggleCompactView}
              icon="fa fa-arrows-v" title="Toggle compact view" />
          </div>
        </div>
      </div>
    );
  }
}

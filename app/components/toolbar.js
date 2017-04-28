/**
 * Toolbar button
 */
import React, { Component } from 'react';

class ToolbarButton extends Component {
  render() {
    return (
      <span className="btn" title={this.props.title} onClick={this.props.action}>
        <i className={this.props.icon}></i>
        <span className="btn-label"> {this.props.label}</span>
      </span>
    );
  }
}

export default class Toolbar extends Component {
  render() {
    return (
      <div className="toolbar">
        <div className="btns btn-pri1">
          <ToolbarButton label="Refresh" action={this.props.actions.refresh}
            icon="fa fa-refresh" title="Refresh task list" />
        </div>
        <div className="btns btn-pri1">
          <ToolbarButton label="Log" action={this.props.actions.showLog}
            icon="fa fa-calendar" title="Show log" />
          <ToolbarButton label="Upload" action={this.props.actions.uploadLogs}
            icon="fa fa-database" title="Upload logged time" />
        </div>
        <div className="btns btn-pri2">
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

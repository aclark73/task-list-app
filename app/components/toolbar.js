/**
 * Toolbar button
 */
import React, { Component } from 'react';

export default class ToolbarButton extends Component {
  render() {
    return (
      <span className="btn" title={this.props.title} onClick={this.props.action}>
        <i className={this.props.icon}></i>
        <span className="btn-label"> {this.props.label}</span>
      </span>
    );
  }
}

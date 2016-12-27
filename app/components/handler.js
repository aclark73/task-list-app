import React, { Component } from 'react';
import classNames from 'classnames';

export class HandlerComponent extends Component {
  render() {
    return "";
  }
}

export class HandlerPopup extends Component {
  renderContents() {
    return "";
  }
  render() {
    return (
      <div key={this.props.label} className={"popup popup-"+this.props.label}>
        <ul>
          <li className="header">{this.props.label}</li>
          {this.renderContents()}
        </ul>
      </div>
    );
  }
}

export class Handler {
  constructor(label, actions) {
    this.label = label;
    this.actions = actions;
    // this.label = 'default';
    // this.toolbar = {
    //   title:'Show status messages',
    //   icon: 'fa fa-exclamation-triangle',
    //   popup: true
    // };
    // this.initialState = {
    // };
  }

  // toolbar() {
  //   return {
  //     title:'Show status messages',
  //     icon: 'fa fa-exclamation-triangle',
  //     popup: true
  //   }
  // }

  /**
   * Return the private state values to start with
   */
  initialState() {
    return {};
  }

  /**
   * Update the private state values
   */
  updateState(state) {
  }

  /**
   * Update the full state
   */
  updateFullState(fullState) {
    // By default, do the private update
    this.updateState(fullState[this.label]);
  }

  component() {
    return (<HandlerComponent />);
  }

  // popup() {
  //   return HandlerPopup;
  // }
}

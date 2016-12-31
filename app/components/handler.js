import React, { Component } from 'react';
import classNames from 'classnames';

export class HandlerPopup extends Component {
  render() {
    console.log("Rendering " + this.props.label + " popup");
    return (
      <div key={this.props.label} className={"popup popup-"+this.props.label}>
        <ul>
          <li className="header">{this.props.label}</li>
          {this.props.contents}
        </ul>
      </div>
    );
  }
}

export class Handler {
  constructor(label, app) {
    this.label = label;
    this.app = app;
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

  // component() {
  //   return (<HandlerComponent />);
  // }

  // popup() {
  //   return HandlerPopup;
  // }
}

import React, { Component } from 'react';
import classNames from 'classnames';

/* A popup window associated with a Handler
 * For example, a "Log" handler could use this to show the log in a
 * standardized popup window:
 * <
 */
export class HandlerPopup extends Component {
    shouldComponentUpdate(nextProps, nextState) {
      return (nextProps.contents != this.props.contents) ||
          (nextProps.tasks != this.props.tasks) ||
          (JSON.stringify(nextProps.context) != JSON.stringify(this.props.context));
    }
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
    * Update the private state values based on the existing private state
    */
    updateState(state, newState) {
        return null;
    }

    /**
    * Update the full state
    */
    updateFullState(fullState, fullNewState) {
        // By default, do the private update on the private state
        const namedState = this.updateState(
            fullState[this.label] || {},
            fullNewState[this.label] || {});
        if (namedState) {
            fullNewState[this.label] = namedState;
        }
    }

    // component() {
    //   return (<HandlerComponent />);
    // }

    // popup() {
    //   return HandlerPopup;
    // }
}

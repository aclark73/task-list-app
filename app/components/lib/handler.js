import React, { Component } from 'react';
import classNames from 'classnames';

/* A popup window associated with a Handler
 * For example, a "Log" handler could use this to show the log in a
 * standardized popup window:
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

/* Basic plugin.
 * The plugin can control various things:
 * - Define a toolbar button calling some action
 * - Define the contents of a standard popup window
 * - Plugins get a "namespace" in the app state, for example the
 *   Status plugin "owns" state['status'].
 *
 */
export class Handler {
    constructor(label, app) {
        this.label = label;
        this.app = app;
    }

    /**
    * Return the private state values to start with
    */
    initialState() {
        return {};
    }

    /**
    * Update the state within this handler's namespace
    * This is called before the app calls setState() and
    * takes the namespaced value of the existing state and
    * the update about to be sent to setState():
    * - state = app.state[label]
    * - newState = appStateUpdate[label]
    * - returns: new value for appStateUpdate[label]
    * Then the app will call:
    * this.setState(appStateUpdate);
    */
    updateState(state, newState) {
        return null;
    }

    /**
    * Update the full state, technically the plugin can do
    * anything, but plugins should use updateState() where possible.
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
}

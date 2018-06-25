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
    * This is called on initialization.
    * :returns the initial state to put in this handler's namespace
    */
    initialState() {
        return {};
    }

    /**
    * This is called by updateFullState()
    * :param state: this handler's namespace in the main app's current state
    * :param newState: this handler's namespace in the main app's new state
    * :returns: any update to this handler's namespace
    * You should typically add values to newState then return it, but you
    * can return a different object to overwrite it.
    */
    updateState(state, newState) {
        return null;
    }

    /**
    * This is called by the main app before it runs setState().
    *
    * :param fullState: The app's current state
    * :param fullNewState: The value being passed to setState()
    *
    * By default, this namespaces both parameters, calls
    * updateState(), and updates the namespaced new state with
    * anything returned.
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

/**
* Status indicator widget
*/
import React, { Component } from 'react';
import classNames from 'classnames';
import ToolbarButton from '../toolbar';
import { Handler, HandlerPopup } from './handler';

/**
 * Popup showing status history [.messages]
 */
class StatusPopup extends Component {
    shouldComponentUpdate(nextProps, nextState) {
        // Update if the length of the history list has changed
        // console.log("nextProps.context: " + JSON.stringify(nextProps.context));
        return (nextProps.messages.length != this.props.messages.length);
    }
    render() {
        // Simple list of each message in the data
        const messages = this.props.messages.map( (message, i) => {
            return (
                <li key={i}>{message}</li>
            );
        });
        return (
            <HandlerPopup label={this.props.label} contents={messages} />
        );
    }
}

/**
 * Transient banner showing each status message
 */
class StatusComponent extends Component {
    render() {
        const className = classNames(
            'status-message',
            this.props.level,
            this.props.expires ? 'show' : 'hide'
        );
        const message = this.props.messages[this.props.messages.length - 1];
        return (
            <div className={className}>{message}</div>
        );
    }
}

/**
 * Handler manages the state
 *
 */
export default class StatusHandler extends Handler {
    initialState() {
        return {
            // All messages collected
            messages: [],
            // The last message is displayed until this time
            expires: 0
        };
    }
    /* Public API: add a message */
    addMessage(state, message, level="info") {
        // Should be a setting
        const timeout = 1;
        // Turn the timeout into an actual time
        const expires = (new Date()).getTime() + timeout*1000;
        return {
            messages: state.messages.concat(['' + message]),
            level: level,
            expires: expires
        };
    }
    updateState(state) {
        // If expired, clear expiry. Is this needed?
        if (state.expires) {
            const now = (new Date()).getTime();
            if (state.expires < now) {
                return {
                    messages: state.messages,
                    level: state.level,
                    expires: 0
                };
            }
        }
        return null;
    }
    /* Render the displayed widget. */
    component(state) {
        return (
            <StatusComponent expires={state.expires}
                level={state.level} messages={state.messages} />
        );
    }
    /* Popup to show when the toolbar button is clicked. */
    popup(state) {
        return (
            <StatusPopup label={this.label} messages={state.messages} />
        );
    }
    /* The toolbar button. */
    toolbarButton() {
        action = this.app.actions.showPopup[this.label];
        return (
            <ToolbarButton
                label={this.label}
                title="Show status messages"
                icon="fa fa-exclamation-triangle"
                action={action} />
        );
    }
}

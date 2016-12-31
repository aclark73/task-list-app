/**
 * Status indicator widget
 */
import React, { Component } from 'react';
import classNames from 'classnames';
import ToolbarButton from './toolbar';
import { Handler, HandlerPopup } from './handler';

class StatusPopup extends React.Component {
  render() {
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

class StatusComponent extends Component {
  render() {
    const className = classNames(
      'status-message',
      this.props.expires ? 'show' : 'hide'
    );
    const message = this.props.messages[this.props.messages.length - 1];
    return (
      <div className={className}>{message}</div>
    );
  }
}

export default class StatusHandler extends Handler {
  initialState() {
    return {
      messages: [],
      expires: 0
    };
  }
  addMessage(state, message, timeout=3) {
    // Turn the timeout into an actual time
    const expires = (new Date()).getTime() + timeout*1000;
    return {
      messages: state.messages.concat(['' + message]),
      expires: expires
    };
  }
  updateState(state) {
    if (state.expires) {
      const now = (new Date()).getTime();
      if (state.expires < now) {
        return {
          messages: state.messages,
          expires: 0
        };
      }
    }
    return null;
  }
  component(state) {
    return (
      <StatusComponent expires={state.expires} messages={state.messages} />
    );
  }
  popup(state) {
    return (
      <StatusPopup label={this.label} messages={state.messages} />
    );
  }
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

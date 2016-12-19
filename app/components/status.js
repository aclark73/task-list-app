/**
 * Status indicator widget
 */
import React from 'react';

export default class StatusHandler {
  constructor() {
    this.label = 'status';
    this.toolbar = {
      title:'Show status messages',
      icon: 'fa fa-exclamation-triangle',
      popup: true
    };
    this.initialState = {
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
      if (state.expires > now) {
        return state;
      }
    }
    return {
      messages: state.messages,
      expires: 0
    }
  }
  statusMessage(state) {
    return (state.expires) ? state.messages[state.messages.length - 1] : '';
  }
  popup(state) {
    const messageRows = state.messages.map( (message, i) => {
      return (
        <li key={i}>{message}</li>
      );
    });
    return (
      <ul><li className="header">Messages</li>{messageRows}</ul>
    );
  }
}

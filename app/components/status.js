/**
 * Status indicator widget
 */
import React from 'react';

export default class StatusHandler {
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
  renderHistory(state) {
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

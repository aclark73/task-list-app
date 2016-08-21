import React, { Component } from 'react';
import Utils from './utils';

export default class Log extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.log.length != this.props.log.length;
  }
  
  render() {
    const logRows = [];
    this.props.log.forEach( (logEntry, i) => {
      logRows.push(
        <li key={i}>{logEntry.task} ({Utils.formatTime(logEntry.timeElapsed)})</li>
      );
    });
    return (
      <div>{logRows}</div>
    );    
  }
}

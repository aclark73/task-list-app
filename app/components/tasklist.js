import React, { Component } from 'react';
import Utils from './utils';
import Task from './task';
import { TaskWidget, ProjectWidget } from './widgets';

export default class TaskList extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    // console.log("nextProps.context: " + JSON.stringify(nextProps.context));
    return (nextProps.projects != this.props.projects) ||
        (nextProps.tasks != this.props.tasks) ||
        (JSON.stringify(nextProps.context) != JSON.stringify(this.props.context));
  }

  render() {
    const rows = [];
    console.log("rendering tasklist");
    if (this.props.context.view == 'projects') {
      this.props.projects.forEach( (project) => {
        rows.push(
          <ProjectWidget key={Task.getUID(project)} task={project} context={this.props.context} />
        );
      });
    } else {
      this.props.tasks.forEach( (task) => {
        rows.push(
          <TaskWidget key={Task.getUID(task)} task={task} context={this.props.context} />
        );
      });
    }
    // console.log("done rendering tasklist?");
    return (
      <div>{rows}</div>
    );
  }
}

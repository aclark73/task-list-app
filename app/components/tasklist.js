import React, { Component } from 'react';
import Utils from './utils';
import Task from './task';
import { TaskWidget, ProjectWidget } from './widgets';

export default class TaskList extends Component {

  render() {
    const rows = [];
    console.log("render tasklist");
    if (this.props.view == 'projects') {
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
    return (
      <div>{rows}</div>
    );
  }
}

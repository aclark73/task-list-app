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
    const tasks = (this.props.context.view == 'projects') ? this.props.projects : this.props.tasks;
    tasks.forEach( (task) => {
      const taskId = Task.getUID(task);
      const widget = Task.isProject(task) ? (
        <ProjectWidget key={taskId} task={task} context={this.props.context} />
      ) : (
        <TaskWidget key={taskId} task={task} context={this.props.context} />
      );
      rows.push(widget);
    });
    return (
      <div>{rows}</div>
    );
  }
}

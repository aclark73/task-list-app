import React, { Component } from 'react';
import Utils from '../utils';
import Task from '../task';
import { Handler, HandlerPopup } from '../handler';
import colormap from 'colormap';
import classNames from 'classnames';

export class LocalTasksEditWidget extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <label>Project:
                    <input type="text" value={this.props.task.title} />
                </label>
            </div>
        );
    }
}

/*
export class LocalTasksEditWidget extends Component {
    constructor(props) {
        super(props);
        this.state = {
            id: 0,
            project: '',
            title: ''
        };
    }

    render() {
        return (
            <div>
                <label>Project:

                </label>
            </div>
        );
    }
  }
}
*/

export default class LocalTasksHandler extends Handler {
    initialState() {
        return {
            projects: []
        };
    }
    updateState(state, newState) {
        // We never use this?
        return null;
    }
    editDialog(task) {
        return (
            <LocalTasksEditWidget task={task} />
        );
    }
    // Called from a button
    createTask() {
        this.editDialog({});
    }
}

export class LocalTasks extends Component {

    constructor(props) {
        super(props);
        this.state = {
            projects: []
        };
        this.source = 'local';
    }

    createProject(projectName) {
        const project = {
            project: projectName,
            source: this.source,
            title: '',
            tasks: []
        };
        this.setState({
            projects: this.state.projects.concat([project])
        });
        return project;
    }

    getCreateProject(projectName) {
        const project = this.state.projecte.find((p) => {
            return (p.name == projectName);
        });
        if (!project) {
            return createProject(projectName);
        }
    }

    createTask(project, task) {

        return {
            project: project,
            title: task.title,
            source: this.source,
            issue_id: task.id,
            issue_number: task.issue_number,
            updated_on: task.updated_on,
            url: 'local:' % task.id
        }
    }

    createProject(name) {
        return {
            project: name,
            source: this.source,
            title: '',
            tasks: []
        };
    }

    create() {
        this.setState({
            editing: true
        });
    }

    createTask(json) {
        /*
        return {
            project: json.project.name,
            title: json.subject,
            source: this.source,
            issue_id: json.id,
            issue_number: json.id,
            updated_on: json.updated_on,
            url: ISSUE_URL % json.id
        };
        */
        return {
            project: json.project,
            title: json.title,
            source: this.source,
            issue_id: json.id,
            issue_number: json.issue_number,
            updated_on: json.updated_on,
            url: 'local:' % json.id
        }
    }
}

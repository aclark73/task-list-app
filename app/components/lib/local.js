import React, { Component } from 'react';
import Utils from '../utils';
import Task from '../task';
import colormap from 'colormap';
import { Handler, HandlerPopup } from './handler';
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

export default class LocalTasksHandler extends Handler {
    initialState() {
        return {
            projects: []
        };
    }
    updateState(state) {
        return null;
    }
    editDialog(task) {
        return (
            <LocalTasksEditWidget task={task} />
        );
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

    getCreateProject(projectName) {
        const project = this.state.projecte.find((p) => {
            return (p.name == projectName);
        });
        if (!project) {

        }
    }

    createTask(project, title) {

        return {
            project: project,
            title: json.title,
            source: this.source,
            issue_id: json.id,
            issue_number: json.issue_number,
            updated_on: json.updated_on,
            url: 'local:' % json.id
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
                    <
            </div>
        )


        rows.push((
          <div key={day + 'w'} className="work">
            <span className="chart">
              {chartMarkers}
            </span>
            {subrows}
          </div>
        ));

      });

      return (
        <li>
          {rows}
        </li>
      );
    }
  }
}

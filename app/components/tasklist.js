import React, { Component } from 'react';
import Utils from './utils';
import Task from './task';
import { TaskWidget, ProjectWidget } from './widgets';

export default class TaskList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            search: ''
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        // console.log("nextProps.context: " + JSON.stringify(nextProps.context));
        return (nextProps.projects != this.props.projects) ||
        (nextProps.tasks != this.props.tasks) ||
        (JSON.stringify(nextState) != JSON.stringify(this.state)) ||
        (JSON.stringify(nextProps.context) != JSON.stringify(this.props.context));
    }

    updateSearch(event) {
        console.log("search", event.target.value);
        // this.props.context.actions.search(event.target.value);
        this.setState({search: event.target.value});
    }

    clearSearch() {
        this.setState({search: ""});
    }

    render() {
        const rows = [];
        console.log("rendering tasklist");
        const tasks = (this.props.context.view == 'projects') ? this.props.projects : this.props.tasks;
        const search = this.state.search.toLowerCase();
        tasks.forEach( (task) => {
            const taskId = Task.getUID(task);
            if (search) {
                const label = Task.getLabel(task);
                if (label.toLowerCase().indexOf(search) < 0) {
                    return;
                }
            }
            const widget = Task.isProject(task) ? (
                <ProjectWidget key={taskId} task={task} context={this.props.context} />
            ) : (
                <TaskWidget key={taskId} task={task} context={this.props.context} />
            );
            rows.push(widget);
        });
        const updateSearch = this.updateSearch.bind(this);
        const clearSearch = this.clearSearch.bind(this);
        const searchWidget = (
            <div className="search">
                <input type="text" value={search} onChange={updateSearch} />
                <button type="button" onClick={clearSearch}>clear</button>
            </div>
        )
        return (
            <div>
                {searchWidget}
                <ul className={this.props.context.view}>
                    {rows}
                </ul>
            </div>
        );
    }
}

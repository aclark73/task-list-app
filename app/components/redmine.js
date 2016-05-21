import fs from 'fs';
import request from 'ajax-request';
//const models = require('./models');
import os from 'os';

const BASE_URL = 'http://dmscode.iris.washington.edu';
const ISSUES_URL = BASE_URL + '/issues.json?key=example&assigned_to_id=me&sort=updated_on:desc&status_id=open&limit=200';

const DEBUG = (os.hostname().indexOf('honu') < 0);

export default class RedmineClient {

    constructor() {
        this.source = 'redmine';
    }

    createProject(name) {
        return {
            project: name,
            source: this.source,
            title: '',
            tasks: []
        };
    };

    createTask(json) {
        /*
         * {  "id":1130,
         *    "project":{"id":2,"name":"DMC Website"},
         *    "tracker":{"id":2,"name":"Feature"},
         *    "status":{"id":1,"name":"New"},
         *    "priority":{"id":4,"name":"Normal"},
         *    "author":{"id":3,"name":"Adam Clark"},
         *    "assigned_to":{"id":3,"name":"Adam Clark"},
         *    "subject":"Tools page should allow filters in the URL",
         *    "start_date":"2014-02-05",
         *    "done_ratio":0,
         *    "created_on":"2014-02-05T23:54:56Z",
         *    "updated_on":"2014-02-05T23:54:56Z"
         *    ...
         *    }
         */
        return {
            project: json.project.name,
            title: json.subject,
            source: this.source,
            issue_id: json.id,
            updated_on: json.updated_on
        };
    }

    parse(json) {
        /*
         * {"issues":[ ... ]}
         */
        const issues = json.issues;

        const tasks = [];
        const projects = [];
        const projectsByName = {};

        for (var i=0; i<issues.length; i++) {
            var task = this.createTask(issues[i]);
            tasks.push(task);
            var projectName = task.project;
            var project = projectsByName[projectName];
            if (! project) {
                project = this.createProject(projectName);
                projects.push(project);
                projectsByName[projectName] = project;
            }
            project.tasks.push(task);
        }
        return Promise.resolve({
          tasks: tasks,
          projects: projects
        });
    }

    fetch() {
        return new Promise(function(resolve, reject) {
            if (DEBUG) {
                fs.readFile('redmine.json', 'utf8', function (err,data) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(JSON.parse(data));
                    }
                });
            } else {
                request(ISSUES_URL, function(err, res, body) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(JSON.parse(body));
                    }
                });
            }
        });
    }

    load() {
        return this.fetch().then(function(json) {
            return this.parse(json);
        }.bind(this));
    }

  getIssueId(taskId) {
    const parts = taskId.split('.');
    if (parts.length == 3) {
      return parts[2];
    } else {
      return "";
    }
  }
  upload(logs) {
    const timePerIssuePerDay = {};
    logs.forEach((log) => {
      const issue_id = this.getIssueId(log.task);
      const day = log.startTime.split('T')[0];
      if (!timePerIssuePerDay[issue_id]) {
        timePerIssuePerDay[issue_id] = {};
      }
      if (!timePerIssuePerDay[issue_id][day]) {
        timePerIssuePerDay[issue_id][day] = 0;
      }
      timePerIssuePerDay[issue_id][day] += log.timeElapsed;
    });
    console.log(timePerIssuePerDay);
    for (let issue_id in timePerIssuePerDay) {
      for (let day in timePerIssuePerDay[issue_id]) {
        const hours = timePerIssuePerDay[issue_id][day] / 3600;
        const rest_dict = {
          'time_entry': {
            'issue_id': parseInt(issue_id),
            'spent_on': day,
            'hours': hours
          }
        };
        console.log(rest_dict);
        
      }
    }
  }
}

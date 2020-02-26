/* eslint-disable */

import fs from 'fs';
import os from 'os';
import Utils from '@/lib/utils';
import user from '@/user';

const DEFAULT_CONFIG = {
};

const BASE_URL = 'http://dmscode.iris.washington.edu';
const ISSUES_URL = BASE_URL + '/issues.json?&assigned_to_id=me&sort=priority:desc,updated_on:desc&status_id=open&limit=200&key=';
const TIME_URL = BASE_URL + '/time_entries.json?key=';
const ISSUE_URL = BASE_URL + '/issue/%s'

const DEBUG = true; // (os.hostname().indexOf('honu') < 0);


function makeProjectUID(project) {
  return `P.${project.source}.${project.name}`;
}

function makeTaskUID(task) {
  if (task.issue_id) {
    return "T." + task.source + "." + task.issue_id;
  } else {
    return "T." + task.source + "." + task.projectName + "." + task.title;
  }
}



export default class RedmineClient {

    constructor(config) {
        config = config || {};
        if (!config.redmine_key) {
          if (user.redmine && user.redmine.key) {
            config.redmine_key = user.redmine.key;
          }
        }
        this.config = config;
        this.source = 'redmine';
        this.sourceIcon = 'fa fa-git';
        if (DEBUG) {
            console.log("RedmineClient in DEBUG");
        }
    }

    createProject(name) {
        return {
            name: name,
            source: this.source,
            title: '',
            tasks: []
        };
    }

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
            projectName: json.project.name,
            title: json.subject,
            source: this.source,
            issue_id: json.id,
            issue_number: json.id,
            updated_on: json.updated_on,
            url: ISSUE_URL % json.id
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
            task.uid = makeTaskUID(task);
            tasks.push(task);
            var projectName = task.projectName;
            var project = projectsByName[projectName];
            if (! project) {
                project = this.createProject(projectName);
                project.uid = makeProjectUID(project);
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
        if (!this.config.redmine_key) {
            console.log("Redmine not configured");
            return Promise.resolve({
                tasks: [],
                projects: [],
            });
        }
        const issues_url = ISSUES_URL + this.config.redmine_key;
        return new Promise(function(resolve, reject) {
            console.log("Fetching redmine");
            if (DEBUG) {
                fs.readFile('redmine.json', 'utf8', function (err,data) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(JSON.parse(data));
                    }
                });
            } else {
                fetch(issues_url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Mac OS X) task-list-app'
                    },
                }).then(function(resp) {
                    if (resp.ok) {
                      resp.json().then(resolve).catch(reject);
                    } else {
                      reject("" + resp.status + ": " + resp.statusText);
                    }
                });
            }
        });
    }

    load() {
        return this.fetch().then(this.parse.bind(this));
    }

  getIssueId(taskId) {
    const parts = taskId.split('.');
    if (parts.length == 3) {
      return parts[2];
    } else {
      return "";
    }
  }

  getSource(taskId) {
    const parts = taskId.split('.');
    if (parts.length == 3) {
      return parts[1];
    } else {
      return "";
    }
  }

  upload(logs) {
    const time_url = TIME_URL + this.config.redmine_key;
    const timePerIssuePerDay = {};
    logs.forEach((log) => {
      const taskId = log.taskId || log.task;
      console.log("Looking at " + taskId);
      if (log.uploadTime) {
        return;
      }
      const source = this.getSource(taskId);
      if (source != this.source) {
        return;
      }
      const issueId = this.getIssueId(taskId);
      if (!issueId) {
        return;
      }
      console.log("Adding " + taskId + " starting at " + log.startTime);

      const day = Utils.getDay(log.startTime);
      if (!timePerIssuePerDay[issueId]) {
        timePerIssuePerDay[issueId] = {};
      }
      if (!timePerIssuePerDay[issueId][day]) {
        timePerIssuePerDay[issueId][day] = 0;
      }
      timePerIssuePerDay[issueId][day] += log.timeElapsed;
    });
    // console.log(JSON.stringify(timePerIssuePerDay));
    const requests = [];
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
        requests.push(new Promise(function(resolve, reject) {
          const body = JSON.stringify(rest_dict);
          console.log(body);
          if (DEBUG) {
            resolve();
          } else {
            console.log("Posting");
            fetch(time_url, {
              method: 'POST',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Mac OS X) task-list-app',
                'Content-Type': 'application/json'
              },
              body: body
            }).then(function(resp) {
              if (resp.ok) {
                resolve();
              } else {
                reject("" + resp.status + ": " + resp.statusText);
              }
            });
          }
        }));
      }
    }
    return Promise.all(requests).then(() => {
      const uploadTime = (new Date()).toISOString();
      // Make copy of log entry, since this is from state and thus immutable
      return logs.map((log) => {
        const l2 = Object.assign({}, log);
        const source = this.getSource(l2.taskId);
        if (source == this.source && !l2.uploadTime) {
          l2.uploadTime = uploadTime;
        }
        return l2;
      });
    });
  }
}

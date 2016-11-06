import fs from 'fs';
import os from 'os';

const USER_PASS = "user:pass@";
const BASE_URL = 'https://' + USER_PASS + 'api.github.com';
const ISSUES_URL = BASE_URL + '/issues';

const DEBUG = (os.hostname().indexOf('honu') < 0);

export default class GitHubClient {

    constructor() {
        this.source = 'github';
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
            project: json.repository.name,
            title: json.title,
            source: this.source,
            issue_id: json.id,
            updated_on: json.updated_at
        };
    }

    parse(json) {
        /*
         * {"issues":[ ... ]}
         */
        const issues = json;

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
            console.log("Fetching github");
            function handleData(err, data) {
                if (err) {
                    reject(err);
                } else {
                    try {
                        const json = JSON.parse(data);
                        resolve(json);
                    }
                    catch (e) {
                        console.log("Failed to parse: " + data);
                        reject(e);
                    }
                }
            }
            if (false) {
                fs.readFile('github.json', 'utf8', function handleData(err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        try {
                            const json = JSON.parse(data);
                            resolve(json);
                        }
                        catch (e) {
                            console.log("Failed to parse: " + data);
                            reject(e);
                        }
                    }
                });
            } else {
                fetch(ISSUES_URL, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Mac OS X) task-list-app'
                    }
                }).then(function(resp) {
                    if (resp.ok) {
                      resp.json().then(function(data) {
                          resolve(data);
                      }).catch(function(e) {
                          reject(e);
                      });
                    } else {
                      reject("" + resp.status + ": " + resp.statusText);
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
}

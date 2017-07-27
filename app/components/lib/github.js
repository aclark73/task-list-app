import fs from 'fs';
import os from 'os';

const DEFAULT_CONFIG = {
    auth_token: 'example'
};

const BASE_URL = 'https://api.github.com';
const ISSUES_URL = BASE_URL + '/issues';

const DEBUG = false; // (os.hostname().indexOf('honu') < 0);

export default class GitHubClient {

    constructor(config) {
        this.config = config || DEFAULT_CONFIG;
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
        {
          "url": "https://api.github.com/repos/aclark73/task-list-app/issues/13",
          "id": 191777901,
          "number": 13,
          "title": "Pull authentication out of code",
          "labels": [
          ],
          "state": "open",
          "locked": false,
          "assignee": {
            "login": "aclark73",
            "id": 1240289,
          },
          "comments": 0,
          "created_at": "2016-11-26T00:28:16Z",
          "updated_at": "2016-11-26T00:28:16Z",
          "closed_at": null,
          "repository": {
            "id": 56657782,
            "name": "task-list-app",
            "full_name": "aclark73/task-list-app",
          },
          "body": "This should be in the config, and user settable"
        },
        */
        return {
            project: json.repository.name,
            title: json.title,
            source: this.source,
            issue_id: json.id,
            issue_number: json.number,
            updated_on: json.updated_at,
            url: json.url
        };
    }

    load() {
        return this.fetch().then(function(json) {
            return this.parse(json);
        }.bind(this));
    }

    parse(json) {
        /*
         * {"issues":[ ... ]}
         */
        const issues = json;

        const tasks = [];
        const projects = [];
        const projectsByName = {};

        /* For each issue, create a task and
         * a project if needed.
         */
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
        const auth_token = this.config.auth_token;
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
                        'User-Agent': 'Mozilla/5.0 (Mac OS X) task-list-app',
                        'Authorization': 'Basic ' + auth_token
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

  getIssueId(taskId) {
      const parts = taskId.split('.');
      if (parts.length == 3) {
          return parts[2];
      } else {
          return "";
      }
  }
}

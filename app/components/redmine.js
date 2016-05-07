const fs = require('fs');
const request = require('ajax-request');
// const models = require('./models');

const BASE_URL = 'http://dmscode.iris.washington.edu';
const ISSUES_URL = BASE_URL + '/issues.json?key=example&assigned_to_id=me&sort=updated_on:desc&status_id=open&limit=200';


export default class RedmineTaskParser {

    constructor() {
      this.source = 'redmine';
      this.promises = {};
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

      const projects = [];
      const projectsByName = {};

      for (var i=0; i<issues.length; i++) {
        var task = this.createTask(issues[i]);
        var projectName = task.project;
        var project = projectsByName[projectName];
        if (! project) {
          project = this.createProject(projectName);
          projects.push(project);
          projectsByName[projectName] = project;
        }
        project.tasks.push(task);
      }
      return Promise.resolve(projects);
    }

    fetch() {
      return new Promise(function(resolve, reject) {
        //request(ISSUES_URL, function(err, res, body) {
        //  if (err) {
        //    reject(err);
        //  } else {
        //    resolve(JSON.parse(body));
        //  }
        //});
        fs.readFile('redmine.json', 'utf8', function (err,data) {
          if (err) {
            reject(err);
          } else {
            resolve(JSON.parse(data));
          }
        });
      });
    }

    load() {
      return this.fetch().then(function(json) {
        return this.parse(json);
      }.bind(this));
    }
}

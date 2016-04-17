const fs = require('fs');
// const models = require('./models');

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
       *    "subject":"Tools page should allow filters in the URL"
       *    ...
       *    }
       */
      return {
        project: json.project.name,
        title: json.subject,
        source: this.source,
        issue_id: json.id
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
        var project = projectsByName[task.project];
        if (! project) {
          project = this.createProject(task.project);
          projects.push(project);
          projectsByName[task.project] = project;
        }
        project.tasks.push(task);
      }
      return Promise.resolve(projects);
    }
    
    fetch() {
      return new Promise(function(resolve, reject) {
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
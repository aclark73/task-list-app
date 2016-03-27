const fs = require('fs');
const models = require('./models');

(function() {

    function TaskWidget(task) {
      this.task = task;
      this.childUIDs = [];
      this.$e = null;
      TaskWidget.items[task.getUID()] = this;
    }
    
    TaskWidget.items = {};
    TaskWidget.rootUIDs = [];
    
    /*
    TaskWidget.getOrCreate = function(task, is_root) {
      const uid = task.getUID();
      if (! TaskWidget.items[uid]) {
        TaskWidget.items[uid] = new TaskWidget(task);
        if (is_root) {
          TaskWidget.roots.push(uid);
        }
      }
      return TaskWidget.items[uid];
    };
    */
    
    TaskWidget.prototype.getType = function() {
      if (this.task.isProject()) {
        return 'project';
      } else {
        return 'task';
      }
    };
    
    TaskWidget.DATA_KEY = 'tl-task';
    TaskWidget.$ITEM = 'li';
    TaskWidget.$EDIT = '.tl-edit';
    TaskWidget.$TOGGLE = '.tl-toggle';
    TaskWidget.$STATUS = '.tl-status';
    
    TaskWidget.prototype.getUID = function() {
      return this.task.getUID();
    }
    
    TaskWidget.prototype.getProjectUID = function() {
      if (this.task.isProject()) {
        return null;
      } else {
        return models.Task.getProjectUID(this.task);
      }
    }
    
    TaskWidget.prototype.getLabel = function() {
      if (this.task.isProject()) {
        return this.task.project;
      } else {
        return this.task.title;
      }
    };
    
    TaskWidget.prototype.render = function() {
      var uid = this.getUID();
      if (!this.$e) {
        const css_class = 'tl-' + this.getType();
        const projectToggle = ' <div class="tl-toggle"><span class="tl-toggle-closed icon icon-right-dir"></span>'
                         + '<span class="tl-toggle-open icon icon-down-dir"></span></div>';
        this.$e = $(' <li class="' + css_class + '">'
                      + ' <div class="list-group-item">'
                      + (this.task.isProject() ? projectToggle : '')
                      + ' <div class="tl-tags">'
                      + ' <span class="tl-tag-running icon icon-star"></span>'
                      + ' </div>'
                      + ' <div class="media-body"><strong> '
                      + this.getLabel()
                      + ' </strong></div>'
                      + ' </div>'
                      + (this.task.isProject() ? ' <ul class="tl-children"></ul>' : '')
                      + ' </li> ');
        if (this.childUIDs) {
          const $children = $(".tl-children", this.$e);
          this.childUIDs.forEach(function(childUID) {
            const child = TaskWidget.items[childUID];
            $children.append(child.render());
          });
        }
        this.$e.data(TaskWidget.DATA_KEY, uid);
      }
      return this.$e;
    };

    
    function RedmineTaskParser() {
      this.source = 'redmine';
      this.promises = {};
    }
    
    RedmineTaskParser.prototype.getCreateTaskInner = function(uid, query, record) {
      console.log("Looking for " + uid);
      if (! TaskWidget.items[uid]) {
        if (! this.promises[uid]) {
          console.log("Looking in db for " + uid);
          this.promises[uid] = new Promise(function(resolve, reject) {
            models.Task.one(query, function(err, task) {
              if (task) {
                resolve(task);
              } else {
                console.log("Creating db record for " + uid);
                models.Task.create(record, function(err, task) {
                  if (task) {
                    resolve(task);
                  } else {
                    reject(err);
                  }
                });
              }
            });
          }).then(function(task) {
            return new TaskWidget(task);
          });
        }
        return this.promises[uid];
      }
      return Promise.resolve(TaskWidget.items[uid]);
    };
    
    RedmineTaskParser.prototype.getCreateProject = function(name, childUIDs) {
      const query = {
        project: name,
        source: this.source,
        title: ''
      };
      const record = $.extend({}, query);
      const uid = models.Task.getProjectUID(record);
      
      return this.getCreateTaskInner(uid, query, record).then(function(project) {
        project.childUIDs = childUIDs;
        return project;
      });
    };
    
    RedmineTaskParser.prototype.getCreateTask = function(json) {
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
      const query = {
        source: this.source,
        issue_id: json.id
      };
      const record = $.extend({}, query, {
        project: json.project.name,
        title: json.subject
      });
      const uid = models.Task.getTaskUID(record);
    
      return this.getCreateTaskInner(uid, query, record);
    };
      
    RedmineTaskParser.prototype.parse = function(json) {
      /*
       * {"issues":[ ... ]}
       */
      const issues = json.issues;
      const promises = [];
      
      for (var i=0; i<issues.length; i++) {
        promises.push(this.getCreateTask(issues[i]));
      }
      return Promise.all(promises).then(function(widgets) {
        const projectChildUIDs = {};
        widgets.forEach(function(widget) {
          const taskUID = widget.getUID();
          var projectName = widget.task.project;
          var projectUID = widget.getProjectUID();
          if (!taskUID || !projectUID) {
            console.log("Missing task/project uid: " + taskUID + "/" + projectUID);
          } else {
            if (TaskWidget.rootUIDs.indexOf(projectUID) < 0) {
              TaskWidget.rootUIDs.push(projectUID);
            }
            if (! projectChildUIDs[projectName]) {
              projectChildUIDs[projectName] = [];
            }
            projectChildUIDs[projectName].push(taskUID);
            console.log("Adding " + taskUID + " to " + projectName);
          }
        });
        const projectPromises = [];
        for (var projectName in projectChildUIDs) {
          if (projectChildUIDs.hasOwnProperty(projectName)) {
            projectPromises.push(this.getCreateProject(projectName, projectChildUIDs[projectName]));
          }
        }
        return Promise.all(projectPromises);
      }.bind(this));
    };
    
    RedmineTaskParser.prototype.fetch = function() {
      return new Promise(function(resolve, reject) {
        fs.readFile('redmine.json', 'utf8', function (err,data) {
          if (err) {
            reject(err);
          } else {
            resolve(JSON.parse(data));
          }
        });
      });
    };
    
    RedmineTaskParser.prototype.load = function() {
      return this.fetch().then(function(json) {
        return this.parse(json);
      }.bind(this));
    };

    exports.TaskWidget = TaskWidget;    
    exports.RedmineTaskParser = RedmineTaskParser;
})();

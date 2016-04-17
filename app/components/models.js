var sqlite = require("sqlite3");
var orm = require("orm");

function getProjectUID(project) {
  return "P." + project.project;
}

function getTaskUID(task) {
  if (task.issue_id) {
	  return "T." + task.source + "." + task.issue_id;
  }
  else {
    return "T." + task.source + "." + task.project + "." + task.title;
  }  
}

orm.connect("sqlite://task_list.db", function (err, db) {
  if (err) throw err;

  var Task = db.define('task', {
	id: { type: "serial" },
	project: String,
	title: String,
	source: String,
	issue_id: String
  }, {
	methods: {
	  isProject: function() {
		return !this.title;
	  },
	  getUID: function() {
		if (this.isProject()) {
            return getProjectUID(this);
        }
		else {
            return getTaskUID(this);
        }
	  }
	},
	validations: {		
	}
  });
  Task.getProjectUID = getProjectUID;
  Task.getTaskUID = getTaskUID;
  // add the table to the database 
  db.sync(function(err) { 
	if (err) throw err;
  });
  
  exports.Task = Task;
});

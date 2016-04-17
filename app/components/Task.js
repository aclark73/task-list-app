const Task = {
  isProject: function(task) {
    return !task.title;
  },
  getProjectUID: function(project) {
    return "P." + project.project;
  },
  getTaskUID: function(task) {
    if (task.issue_id) {
      return "T." + task.source + "." + task.issue_id;
    } else {
    	return "T." + task.source + "." + task.project + "." + task.title;
    }  
  },
  getUID: function(task) {
	if (Task.isProject(task)) {
      return Task.getProjectUID(task);
    } else {
      return Task.getTaskUID(task);
    }
  },
  getLabel: function(task) {
    if (Task.isProject(task)) {
      return task.project;
    } else if (task.issue_id) {
      return '#' + task.issue_id + ' - ' + task.title;
    } else {
      return task.title;
    }
  }
};
export default Task;
import projectColors from './ProjectColors';

class Task {
  constructor({
    title,
    project,
    source,
    issue_id,
    issue_number,
    updated_on,
    url,
  }) {
    this.title = title;
    this.project = project;
    this.source = source;
    this.issue_id = issue_id;
    this.issue_number = issue_number;
    this.updated_on = updated_on;
    this.url = url;
  }
  getUID() {
    if (task.issue_id) {
      return "T." + task.source + "." + task.issue_id;
    } else {
    	return "T." + task.source + "." + task.project.name + "." + task.title;
    }
  },
  getProjectUID() {
    return this.project.getUID();
  },
};

export default Task;


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

export default class Task {
  constructor(data) {
    this._data = data;
    
    this.id = data['id'];
    this.project = data['project'];
    this.title = data['title'];
    this.source = data['source'];
    this.issue_id = data['issue_id'];
    this.getProjectUID = getProjectUID;
    this.getTaskUID = getTaskUID;
  }
  
  isProject() {
    return !this.title;
  }
  
  getUID() {
		if (this.isProject()) {
            return this.getProjectUID();
        }
		else {
            return this.getTaskUID();
        }
	  }
  }
}

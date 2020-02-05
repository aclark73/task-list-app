import projectColors from './ProjectColors';

class Project {
  constructor({
    name,
    source,
    title,
    tasks,
  }) {
    this.name = name;
    this.source = source;
    this.title = title;
    this.tasks = [];
  }
  getUID() {
    return "P." + this.name;
  },
  getColor(project) {
    return projectColors.getProjectColor(this.name);
  },
};

export default Project;

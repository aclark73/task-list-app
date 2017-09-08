// Project colors
function getHue(idx) {
   /* Here we use 31 bit numbers because JavaScript doesn't have a 32 bit unsigned type, and so the conversion to float would produce a negative value. */
   const bitcount = 31;

   /* Reverse the bits of idx into ridx */
   var ridx = 0, i = 0;
   for (i=0; i < bitcount; i++) {
      ridx = (ridx << 1) | (idx & 1);
      idx >>>= 1;
   }

   /* Divide by 2**bitcount */
   const hue = ridx / Math.pow(2, bitcount);

   /* Start at .6 (216 degrees) */
   return (hue + .6) % 1;
}
var _nextHue = 0;
function nextHue() {
    const hue = getHue(_nextHue++);
    const degrees = Math.round(hue * 360);
    // return 'hsl(' + degrees + ', 100%, 96%)';
    return degrees;
}

const _projectColors = {};

const Task = {
  isProject: function(task) {
    return !task.title;
  },
  getProjectUID: function(project) {
    return "P." + project.project;
  },
  /* Really complicated way of assigning colors to projects! */
  setProjectColors: function(projects, tasks) {
    /* Score each project by # of tasks */
    const score = {};
    const projectNames = [];
    tasks.forEach( (task, i) => {
      const projectName = task.project;
      const taskScore = Math.max(1, 4 - (i/10));
      if (!score[projectName]) {
        projectNames.push(projectName);
        score[projectName] = 0;
      }
      score[projectName] += taskScore;
    });
    projectNames.sort(function(a, b) {
      return score[a] - score[b];
    });
    projectNames.forEach(function(projectName) {
      if (_projectColors[projectName] === undefined) {
          _projectColors[projectName] = nextHue();
      }
    });
  },
  getProjectColor: function(project) {
      if (_projectColors[project] === undefined) {
          _projectColors[project] = nextHue();
      }
      return _projectColors[project];
  },
  getTaskUID: function(task) {
    if (task.issue_id) {
      return "T." + task.source + "." + task.issue_id;
    } else {
    	return "T." + task.source + "." + task.project + "." + task.title;
    }
  },
  getUID: function(task) {
    if (!task.source) { return ''; }
  	if (Task.isProject(task)) {
      return Task.getProjectUID(task);
    } else {
      return Task.getTaskUID(task);
    }
  },
  getLabel: function(task) {
    if (!task.source) { return ''; }
    if (Task.isProject(task)) {
      return task.project;
    } else {
      return task.title;
    }
  },
  getIssueNumber: function(task) {
    if (task.issue_number) {
      return "#" + task.issue_number;
    } else {
      return '';
    }
  }
};
export default Task;

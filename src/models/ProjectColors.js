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

class ProjectColors {
  constructor() {
    this.colors = {};
  }
  /* Really complicated way of assigning colors to projects! */
  addProjectsAndTasks(projects, tasks) {
    /* Score each project by # of tasks */
    const score = {};
    const projectNames = [];
    tasks.forEach( (task, i) => {
      const projectName = task.project;
      const taskScore = Math.max(1, 4 - (i/10));  // ???
      if (!score[projectName]) {
        projectNames.push(projectName);
        score[projectName] = 0;
      }
      score[projectName] += taskScore;
    });
    projectNames.sort((a, b) => score[a] - score[b]);
    projectNames.forEach((projectName) => {
      if (this.colors[projectName] === undefined) {
          this.colors[projectName] = nextHue();
      }
    });
  }
  getProjectColor(project) {
      if (this.colors[project] === undefined) {
          this.colors[project] = nextHue();
      }
      return this.colors[project];
  }
}

const projectColors = new ProjectColors();

export default projectColors;

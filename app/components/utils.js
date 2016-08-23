const Utils = {
  pad2: function(d) {
    return (d >= 10 ? '' : '0') + d;
  },

  formatTimespan: function(t) {
    var neg = (t < 0);
    t = Math.abs(t);
    var s = t%60;
    var m = (Math.trunc(t/60)%60);
    var h = Math.trunc(t/3600);

    var sign = neg ? '-' : '';
    if (h > 0) {
      return sign + h + ':' + Utils.pad2(m) + ':' + Utils.pad2(s);
    } else {
      return sign + m + ':' + Utils.pad2(s);
    }
  },
  
  getDay: function(timestamp) {
    const d = new Date(timestamp);
    return "" + d.getFullYear() + "-" +
      Utils.pad2(d.getMonth() + 1) + "-" +
      Utils.pad2(d.getDate());
  },
  
  getTime: function(timestamp) {
    const d = new Date(timestamp);
    return "" + Utils.pad2(d.getHours()) + ":" +
      Utils.pad2(d.getMinutes());
  },
  
  timePerTaskPerDay: function(log) {
    const tasks = {};
    const days = {};
    log.forEach((logEntry) => {
      const task_id = logEntry.task;
      const day = logEntry.startTime.split('T')[0];
      days[day] = 1;
      if (!tasks[task_id]) {
        tasks[task_id] = {};
      }
      if (!tasks[task_id][day]) {
        tasks[task_id][day] = 0;
      }
      tasks[task_id][day] += logEntry.timeElapsed;
    });
    console.log(tasks);
    return tasks;
  },
  
  timePerDayPerTask: function(log) {
    const days = {};
    log.forEach((logEntry) => {
      const task_id = logEntry.task;
      const day = logEntry.startTime.split('T')[0];
      if (!days[day]) {
        days[day] = {};
      }
      if (!days[day][task_id]) {
        days[day][task_id] = 0;
      }
      days[day][task_id] += logEntry.timeElapsed;
    });
    console.log(days);
    return days;
  }
  
};
export default Utils;

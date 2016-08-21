const Utils = {
  formatTimespan: function(t) {
    var neg = (t < 0);
    t = Math.abs(t);
    var s = t%60;
    var m = (Math.trunc(t/60)%60);
    var h = Math.trunc(t/3600);

    function pad2(d) {
      return (d >= 10 ? '' : '0') + d;
    }

    var sign = neg ? '-' : '';
    if (h > 0) {
      return sign + h + ':' + pad2(m) + ':' + pad2(s);
    } else {
      return sign + m + ':' + pad2(s);
    }
  },
  
  getDay: function(timestamp) {
    return timestamp.split('T')[0];
  },
  
  getTime: function(timestamp) {
    return timestamp.split('T')[1].split('.')[0];
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

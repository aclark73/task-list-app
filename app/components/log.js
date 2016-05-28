

const Log = {
  TimePerTaskPerDay: function(logs) {
    const tasks = {};
    const days = {};
    logs.forEach((log) => {
      const task_id = log.task;
      const day = log.startTime.split('T')[0];
      days[day] = 1;
      if (!tasks[task_id]) {
        tasks[task_id] = {};
      }
      if (!tasks[task_id][day]) {
        tasks[task_id][day] = 0;
      }
      tasks[task_id][day] += log.timeElapsed;
    });
    console.log(tasks);
    return tasks;
  },
  TimePerDayPerTask: function(logs) {
    const days = {};
    logs.forEach((log) => {
      const task_id = log.task;
      const day = log.startTime.split('T')[0];
      if (!days[day]) {
        days[day] = {};
      }
      if (!days[day][task_id]) {
        days[day][task_id] = 0;
      }
      days[day][task_id] += log.timeElapsed;
    });
    console.log(days);
    return days;
  }
};
export default Log;
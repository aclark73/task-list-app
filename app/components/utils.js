import humanizeDuration from 'humanize-duration';

const baseHumanizerConfig = {
  language: 'shortEn',
  largest: 1,
  spacer: '',
  languages: {
    shortEn: {
      y: function() { return 'y' },
      mo: function() { return 'mo' },
      w: function() { return 'w' },
      d: function() { return 'd' },
      h: function() { return 'h' },
      m: function() { return 'm' },
      s: function() { return 's' },
      ms: function() { return 'ms' },
    }
  },
  round: true,
  units: ['y', 'mo', 'd', 'h', 'm']
};

const englishHumanizer1 = humanizeDuration.humanizer(
  Object.assign({}, baseHumanizerConfig));
  
const englishHumanizer2 = humanizeDuration.humanizer(
  Object.assign({}, baseHumanizerConfig, {largest: 2}));


const Utils = {
  pad2: function(d) {
    return (d >= 10 ? '' : '0') + d;
  },

  formatTimespan: function(seconds, humanize) {
    var neg = (seconds < 0);
    seconds = Math.abs(seconds);
    var s = seconds%60;
    var m = Math.trunc(seconds/60)%60;
    var h = Math.trunc(seconds/3600);

    var sign = neg ? '-' : '';
    if (humanize) {
      if (h > 0) {
        return sign + h + 'h' +  m + 'm';
      } else {
        return sign + m + 'm';
      }
    } else {
      if (h > 0) {
        return sign + h + ':' + Utils.pad2(m) + ':' + Utils.pad2(s);
      } else {
        return sign + m + ':' + Utils.pad2(s);
      }
    }
  },

  humanTimespan: function(s) {
    return englishHumanizer1(s*1000);
  },

  getDuration: function(t1, t2) {
    try {
      const durationMS = Math.floor((new Date(t2) - new Date(t1)));
      if (isNaN(durationMS)) {
        throw "NaN!";
      }
      // console.log("" + t2 + " - " + t1 + " = " + duration);
      return durationMS/1000;
    }
    catch (e) {
      console.log("" + t1 + " - " + t2 + " = " + e);
      return 0;
    }
  },

  getDayTime: function(timestamp) {
    if (!timestamp) { return '-'; }
    const d = new Date(timestamp);
    return "" + d.getFullYear() + "-" +
      Utils.pad2(d.getMonth() + 1) + "-" +
      Utils.pad2(d.getDate()) + " " +
      d.getHours() + ":" +
      Utils.pad2(d.getMinutes());
  },

  getDay: function(timestamp) {
    if (!timestamp) { return '-'; }
    const d = new Date(timestamp);
    return "" + d.getFullYear() + "-" +
      Utils.pad2(d.getMonth() + 1) + "-" +
      Utils.pad2(d.getDate());
  },

  getTime: function(timestamp) {
    if (!timestamp) { return '-'; }
    const d = new Date(timestamp);
    /*
    return "" + Utils.pad2(d.getHours()) + ":" +
      Utils.pad2(d.getMinutes());
    */
    const raw_h = d.getHours();
    const h = raw_h == 0 ? 12 : raw_h > 12 ? raw_h - 12 : raw_h;
    const ap = raw_h >= 12 ? "a" : "p";
    const m = Utils.pad2(d.getMinutes());
    return "" + h + ":" + m + ap;
  },

  timePerTaskPerDay: function(log) {
    const tasks = {};
    const days = {};
    log.forEach((logEntry) => {
      const task_id = logEntry.taskId;
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
      const task_id = logEntry.taskId;
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
  },

  lastWorkPerTask: function(log) {
    const lastWork = {};
    log.forEach((logEntry) => {
      const taskId = logEntry.taskId;
      if (!lastWork[taskId] || lastWork[taskId] < logEntry.startTime) {
        lastWork[taskId] = logEntry.startTime;
      }
    });
    return lastWork;
  }

};
export default Utils;

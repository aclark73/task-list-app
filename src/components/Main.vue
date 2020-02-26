<template>
  <div :class="cssClass">
    <div class="timer"></div>
    <div class="toolbar">
      <button type="button" @click="loadTasks">Load Tasks</button>
    </div>
    <div class="task-list">
      <div v-for="task in sortedTasks" :key="task.uid"
          @click="selectTask(task.uid)" :class="{selected: currentTaskID == task.uid}">
        {{ task.title }}
      </div>
    </div>
  </div>
</template>

<script>

import RedmineClient from '@/lib/redmine';

export default {
  name: 'Main',
  data() {
    return {
      timer: {
        startTime: 0,
        lastWorkTime: 0,
        elapsed: 0,
        remaining: 0,
        idle: 0,
        status: 'stopped',
        timerID: 0,
      },
      currentTaskID: null,
      tasks: {},
      projects: {},
    };
  },
  created() {
    this.$options.clients = [new RedmineClient()];
    const icons = {};
    this.$options.clients.forEach((client) => {
      icons[client.source] = client.sourceIcon;
    });
    this.$options.sourceIcons = icons;
  },
  computed: {
    cssClass() {
      return `status-${this.timer.status}`;
    },
    currentTask() {
      if (this.currentTaskID) {
        return this.tasks[this.currentTaskID];
      } else {
        return null;
      }
    },
    sortedTasks() {
      const tasks = Object.values(this.tasks);
      tasks.sort((a, b) => {
        if (a.updated_on < b.updated_on) {
          return -1;
        }
        if (a.updated_on > b.updated_on) {
          return 1;
        }
        return 0;
      });
      return tasks;
    },
  },
  methods: {
    async loadTasks() {
      const projects = {};
      const tasks = {};
      const requests = [];
      this.$options.clients.forEach((client) => {
        requests.push(client.load());
      });
      const responses = await Promise.all(requests);
      responses.forEach((data) => {
        data.projects.forEach((project) => {
          projects[project.uid] = project;
        });
        data.tasks.forEach((task) => {
          tasks[task.uid] = task;
        });
      });
      this.tasks = tasks;
      this.projects = projects;
    },
    selectTask(taskUID) {
      this.currentTaskID = taskUID;
    },
  },
};

</script>

<style>
.selected {
  background: #9f9;
}
</style>

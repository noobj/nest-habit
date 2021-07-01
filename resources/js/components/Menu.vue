<template>
  <div class="relative self-end m-4">
    <div class="inline-block">
        <img
        class="rounded-full w-6 h-6 cursor-pointer"
        v-on:click="syncProject()"
        v-bind:src="'/img/sync.png'"
      />
    </div>
    <div class="py-2 px-4 whitespace-nowrap font-bold inline-block mr-48">
        Last Updated: {{ lastUpdated }}
    </div>

    <div class="py-2 px-4 text-center whitespace-nowrap font-bold inline-block">
      Current Project:
      <select
        class="border rounded-full font-bold text-gray-600 h-10 pl-5 pr-10"
        v-on:change="changeProject($event)"
      >
        <option
          class="text-gray-600 font-bold"
          v-for="project in projects"
          :key="project"
          :selected="project == currentPrj.name"
        >
          {{ project }}
        </option>
      </select>
    </div>
    <div class="place-content-end cursor-pointer inline-block">
      <img
        class="rounded-full w-16 h-16"
        v-on:click="toggle = !toggle"
        v-bind:src="'/img/' + avatarFileName"
      />
    </div>
    <div
      class="absolute right-0 z-10 mt-2 overflow-hidden rounded"
      v-if="toggle"
    >
      <div
        class="py-2 px-4 bg-black dark:bg-white bg-opacity-30 hover:bg-opacity-20 text-center whitespace-nowrap font-bold cursor-pointer"
        @click="$refs.file.click()"
      >
        Upload Avatar
        <input
          class="hidden"
          type="file"
          ref="file"
          @change="handleFileUpload()"
        />
      </div>

      <div
        class="py-2 px-4 bg-black dark:bg-white bg-opacity-30 hover:bg-opacity-20 text-center whitespace-nowrap font-bold cursor-pointer"
        @click="setApiToken()"
      >
        Set Api Token
      </div>

      <div
        class="py-2 px-4 bg-black dark:bg-white bg-opacity-30 hover:bg-opacity-20 text-center whitespace-nowrap font-bold cursor-pointer"
        @click="logout()"
      >
        Logout
      </div>
    </div>
  </div>
</template>

<script>
import { checkAuth } from '../utils'

export default {
  name: "Menu",
  props: {},
  data() {
    return {
      avatarFileName: "default.jpg",
      toggle: false,
      projects: [],
      currentPrj: {name: null, last_updated: null},
      lastUpdated: null
    };
  },
  sockets: {
    connect: () => {
      console.log('socket connected');
    },
    sync: function (data) {
      const result = JSON.parse(data);
      const tmpDate = new Date(result.current_project.last_updated);
      this.lastUpdated = tmpDate.toString().split(/[a-zA-Z]{3}\+/)[0];
    },
    notice: (message) => {
      const child = document.createElement("P");
      const newRecord = JSON.parse(message);
      child.innerText = `${newRecord.account} added new entry ${newRecord.duration}`;
      child.className = 'animate-pulse mr-2 inline-block bg-pink-500 text-white font-bold py-2 px-4 rounded-lg opacity-80'
      document.querySelector('#newRecord').appendChild(child);
      setTimeout(function(){ document.querySelector('#newRecord').removeChild(child); }, 5000);

    },
    exception: async function (data) {
        if (data.status == 401) {
            await checkAuth()
            .then(() => {
                this.$socket.disconnect();
                this.$socket.connect();
                setTimeout(() => {
                    this.$socket.emit("sync", { projectName: this.currentPrj.name
                })}, 500);
            });
        }
    },
    disconnect: () => {
      console.log('disconnect');
    }
  },
  computed: {},
  filters: {},
  methods: {
    setApiToken() {
        const apiToken = prompt('Please enter the new token:');
        if (!apiToken) return;
        const check = confirm('This will delete all the existing, Are you sure?')
        if (check) {
          fetch('/api_token', {
            method: "Post",
            credentials: "include",
            body: new URLSearchParams({
              'api_token': apiToken,
            }),
          }).then((res) => {
            if (res.status != 201) throw new Error();

            alert('token updated');
            location.reload();
          }).catch(() => {
            alert('token update failed');
          })
        }
    },
    changeProject(event) {
      fetch('/project', {
        method: "Post",
        credentials: "include",
        body: new URLSearchParams({
          'project_name': event.target.value,
        }),
      }).then((res) => {
        if (res.status != 201) throw new Error();

        alert('project updated');
        location.reload();
      }).catch(() => {
        alert('project update failed');
      });
    },
    syncProject() {
      this.$socket.emit("sync", { projectName: this.currentPrj.name })
    },
    logout() {
      fetch('/logout')
        .then((res) => {
          if (res.status != 200) throw new Error();

          window.location.href = '/login.html';
        }).catch(() => {
          alert('logout failed, you have been traped here.');
        })
    },
    handleFileUpload() {
      const file = this.$refs.file.files[0];

      if (!file.name.match(/\.(jpg|jpeg|png|gif)$/)) {
        alert("Only image files are allowed!");
        throw new Error("Only image files are allowed!");
      }

      let formData = new FormData();

      formData.append("file", file);

      fetch(`/upload_avatar`, {
        method: "Post",
        credentials: "same-origin",
        body: formData,
      })
        .then((res) => {
          if (res.status != 201) throw new Error();

          return res.json();
        })
        .then((res) => {
          this.avatarFileName = "default.jpg";
          alert("upload success");
          return res;
        })
        .then((res) => {
          // due to the same filename, the img won't refresh after uploaded,
          // so we need to set it to default first, and set back to filename
          this.avatarFileName = res.filename;
        })
        .catch((e) => {
          alert("upload failed");
        });
    },
  },
  mounted() {
    fetch("/profile")
      .then((res) => checkAuth(res, '/profile'))
      .then((res) => {
        return res.json();
      })
      .then(async (user) => {
        const fetchAvatar = await fetch(`/img/${user.id}.jpg`);
        if (fetchAvatar.status == 404) return;

        this.avatarFileName = `${user.id}.jpg`;
      });

    fetch("/projects")
      .then((res) => checkAuth(res, '/projects'))
      .then((res) => res.json())
      .then((res) => {
        this.projects = res.data.allProjects;

        if (res.data.currentProject) {
          this.currentPrj = res.data.currentProject;
          const tmpDate = new Date(res.data.currentProject.last_updated);
          this.lastUpdated = tmpDate.toString().split(/[a-zA-Z]{3}\+/)[0];
        }
      });
  },
};
</script>

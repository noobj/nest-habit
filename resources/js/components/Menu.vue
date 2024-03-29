<template>
  <div class="relative self-end m-4">

    <div class="border shadow-md rounded z-10 fixed px-8 pt-6 pb-8 mb-4 w-1/3 bg-gray-800 font-bold" v-if="formToggl">
       <h1 class="block w-full text-center mb-6 text-xl"> Service Settings </h1>
       <label class="block text-sm mb-2" for="service">Third Party Service</label>
       <select
        class="border rounded bg-gray-800 h-10 pl-5 pr-10 cursor-pointer border-blue-500 font-bold"
        id="service" ref="service"
      >
        <option
          class="text-gray-600"
          v-for="service in thirdPartyServices"
          :key="service"
        >
          {{ service }}
        </option>
      </select>
      <br /> <br />
      <label class="block text-sm mb-2" for="token">Api Token</label>
      <input type="text" class="bg-gray-800 shadow appearance-none border rounded w-full border-blue-500 py-2 px-3 leading-tight
       focus:outline-none focus:shadow-outline" ref="token" id="token"/>
        <br /> <br />
        <button class="flex-shrink-0 bg-purple-500 hover:bg-purple-700 text-sm
         text-white py-2 px-3 rounded" v-on:click="setApiToken()" type="button">
            Submit
        </button>

        <br /><br />
        <button ref="subTokenBtn" class="flex-shrink-0 bg-blue-500 hover:bg-blue-700 text-sm
         text-white py-2 px-3 rounded cursor-pointer" v-on:click="generateSubToken()" type="button">
            Generate token for subscribing on Telegram
        </button>
        <br />
        <p ref="subTokenWarning" class="mt-2 hidden text-xs font-medium text-red-600">This token will expire in {{ countDown }} seconds.</p>
        <p ref="subToken" class="pr-2 inline" />
        <button ref="subTokenCopy" class="hidden bg-red-500 hover:bg-red-700 rounded px-1 text-xs" v-on:click="copySubToken()">copy</button>

        <div id="mdiv" class="absolute top-0 right-0 cursor-pointer" v-on:click="formToggl = false">
            <div class="mdiv">
                <div class="md"></div>
            </div>
        </div>
    </div>
    <div class="inline-block">
        <img
        class="rounded-full w-6 h-6 cursor-pointer"
        v-on:click="syncProject()"
        v-bind:src="imgServerUrl + 'sync.png'"
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
    <div
      @click="show()"
      id="avatar"
      class="cursor-pointer inline-block">
      <img
        class="rounded-full w-16 h-16"
        ref="avatar"
        v-bind:src="imgServerUrl + avatarFileName"
      />
    </div>
    <div
      id="settings"
      v-click-outside="hide"
      class="invisible absolute right-0 z-10 mt-2 overflow-hidden rounded"
    >
      <div
        class="py-2 border bg-gray-900 px-4 bg-opacity-90 hover:bg-blue-400 text-center whitespace-nowrap font-bold cursor-pointer"
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
        class="py-2 border bg-gray-900 px-4 bg-opacity-90 hover:bg-blue-400 text-center whitespace-nowrap font-bold cursor-pointer"
        @click="showServiceSetting()"
      >
        Service Settings
      </div>

      <div
        class="py-2 border bg-gray-900 px-4 bg-opacity-90 hover:bg-blue-400 text-center whitespace-nowrap font-bold cursor-pointer"
        @click="logout()"
      >
        Logout
      </div>
    </div>
  </div>
</template>

<script>
import { fetchOrRefreshAuth } from '../utils';
import ClickOutside from 'vue-click-outside';

export default {
  name: "Menu",
  props: {},
  directives: {
    ClickOutside
  },
  data() {
    return {
      avatarFileName: "default.jpg",
      formToggl:false,
      projects: [],
      thirdPartyServices: [],
      currentService: {name: null},
      currentPrj: {name: null, last_updated: null},
      lastUpdated: null,
      imgServerUrl: process.env.VUE_APP_IMG_S3_URL,
      userId: null,
      countDown: process.env.VUE_APP_SUB_TOKEN_COUNTDOWN
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
      setTimeout(function(){ document.querySelector('#newRecord').removeChild(child); }, 10000);

    },
    exception: async function (data) {
        if (data.status == 401) {
            await  fetch('/refresh', {
                credentials: 'include',
            })
            .then(async (res) => {
                if (res.status == 200) {
                    return;
                }

                window.location.href = '/login.html';
            })
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
    showServiceSetting() {
        this.formToggl = true;
        fetchOrRefreshAuth('/services')
            .then((res) => res.json())
            .then((res) => {
                this.thirdPartyServices = res;
            });
    },
    setApiToken() {
        const service = this.$refs.service.value;
        const apiToken = this.$refs.token.value;
        if (!apiToken) return;

        const check = confirm('This will delete all the existing, Are you sure?')
        const opts = {
            method: "Post",
            credentials: "include",
            body: new URLSearchParams({
              'api_token': apiToken,
              'service': service
            }),
          };

        if (check) {
          fetchOrRefreshAuth('/api_token', opts)
          .then((res) => {
            if (res.status != 201) throw new Error(res.status);

            alert('token updated');
            location.reload();
          }).catch((e) => {
            if (e.message === '403') {
                alert('invalid token');
                return;
            }

            alert('token update failed');
          })
        }
    },
    changeProject(event) {
      fetchOrRefreshAuth('/project', {
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
      fetchOrRefreshAuth('logout')
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

      fetchOrRefreshAuth(`/upload_avatar`, {
        method: "Post",
        credentials: "same-origin",
        body: formData,
      })
        .then(async (res) => {
          if (res.status != 201) {
            res = await res.json();
            alert(`Upload failed`);
            return;
          }

          return res.json();
        })
        .then((res) => {
          // Reload the avatar
          // gotta use arrow function here, since it can get the "this" from parent
          setTimeout(() => {
            this.$refs.avatar.src = `${this.imgServerUrl}${this.userId}.jpg?t=${new Date().getTime()}`;
          }, 1000);
        })
        .catch((e) => {
          alert(`Upload failed: ${e.message}`);
        });
    },
    hide() {
      document.querySelector('#settings').classList.add('invisible');
    },
    show() {
      document.querySelector('#settings').classList.toggle('invisible');
    },
    generateSubToken() {
      fetchOrRefreshAuth('/sub_token')
      .then(async (res) => {
        if (res.status != 200) throw new Error();
        this.countDown = process.env.VUE_APP_SUB_TOKEN_COUNTDOWN;
        this.countDownTimer();

        this.$refs.subToken.innerHTML = await res.text();
        this.$refs.subTokenBtn.classList.remove("bg-blue-500", "text-sm", "hover:bg-blue-700")
        this.$refs.subTokenBtn.classList.add("bg-grey-500", "italic", "text-xs", "cursor-not-allowed");
        this.$refs.subTokenBtn.disabled = true;
        this.$refs.subTokenWarning.classList.remove("hidden");
        this.$refs.subTokenCopy.classList.remove("hidden");
        setTimeout(() => {
          this.$refs.subTokenBtn.disabled = false;
          this.$refs.subTokenBtn.classList.remove("bg-grey-500", "italic", "text-xs", "cursor-not-allowed")
          this.$refs.subTokenBtn.classList.add("bg-blue-500", "text-sm", "hover:bg-blue-700");
        }, process.env.VUE_APP_SUB_TOKEN_COUNTDOWN * 1000);
      })
      .catch((err) => {
        console.log(err);
        alert('fetch sub token error.');
      })
    },
    countDownTimer() {
      if (this.countDown > 0) {
          setTimeout(() => {
              this.countDown -= 1
              this.countDownTimer();
          }, 1000)
      }
    },
    copySubToken() {
      const node = this.$refs.subToken;
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(node);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand("copy");
    }
  },
  mounted() {
    // prevent click outside event with popupItem.
    this.popupItem = document.querySelector('#avatar');

    fetchOrRefreshAuth("/profile")
      .then((res) => {
        return res.json();
      })
      .then(async (user) => {
        this.userId = user.id;
        const fetchAvatar = await fetch(`${this.imgServerUrl}${user.id}.jpg`, {mode: 'cors'});

        if (fetchAvatar.status === 403) return;

        this.avatarFileName = `${user.id}.jpg`;
      });

    fetchOrRefreshAuth('/projects')
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

<style>
#mdiv {
  width: 25px;
  height: 25px;
  background-color: red;
}

.mdiv {
  height: 25px;
  width: 2px;
  margin-left: 12px;
  background-color: black;
  transform: rotate(45deg);
  Z-index: 1;
}

.md {
  height: 25px;
  width: 2px;
  background-color: black;
  transform: rotate(90deg);
  Z-index: 2;
}
</style>
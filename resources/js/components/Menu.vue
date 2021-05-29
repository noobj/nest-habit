<template>
    <div class="relative self-end m-4">
        <div
                class="py-2 px-4 text-center whitespace-nowrap font-bold inline-block"
            >
                Current Project:
                <select
                    class="border rounded-full font-bold text-gray-600 h-10 pl-5 pr-10"
                    v-on:change="changeProject($event)"
                >
                    <option class="text-gray-600 font-bold" v-for="project in projects" :key="project" :selected="project == currentPrj">
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
        <div class="absolute right-0 z-10 mt-2 overflow-hidden rounded" v-if="toggle">
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
                @click="logout()"
            >
                Logout
            </div>
        </div>
    </div>
</template>

<script>
export default {
  name: "Menu",
  props: {},
  data() {
    return {
      avatarFileName: "default.jpg",
      toggle: false,
      projects: [],
        currentPrj: null,
    };
  },
  computed: {},
  filters: {},
  methods: {
    changeProject(event) {
        fetch('/project', {
            method: "Post",
            credentials: "same-origin",
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
      .then((res) => {
        return res.json();
      })
      .then(async (user) => {
        const fetchAvatar = await fetch(`/img/${user.id}.jpg`);
        if (fetchAvatar.status == 404) return;

                this.avatarFileName = `${user.id}.jpg`;
            });

        fetch("/projects")
            .then((res) => res.json())
            .then((res) => {
                this.projects = res.data.allProjects;
                this.currentPrj = res.data.currentProject;
            });
    },
};
</script>

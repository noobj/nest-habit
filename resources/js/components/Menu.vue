<template>
    <div class="relative self-end">
        <div class="place-content-end">
            <img
                class="rounded-full w-16 h-16"
                v-on:click="toggle = !toggle"
                v-bind:src="'/img/' + avatarFileName"
            />
        </div>
        <div
            class="absolute float-right bg-gray-500 w-96 z-10 right-0 h-screen"
            v-if="toggle"
        >
            <input type="file" id="file" ref="file" v-on:change="handleFileUpload()" />
            <br />
            <br />
            <button
                class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
                v-on:click="logout()"
            >
                Logout
            </button>
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
            toggle: true,
        };
    },
    computed: {},
    filters: {},
    methods: {
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
                    console.log(e);
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
    },
};
</script>

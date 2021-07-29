import Vue from 'vue';
import Main from './Main';
import '/resources/css/app.css';
import VSocket from 'vue-socket.io';

Vue.use(
    new VSocket({
        connection: window.location.host
    })
);

Vue.config.productionTip = false;

new Vue({
    render: (h) => h(Main)
}).$mount('#main');

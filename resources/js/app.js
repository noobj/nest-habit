import Vue from 'vue';
import Main from './Main';
import '/resources/css/app.css';
import VSocket from 'vue-socket.io';

Vue.use(
    new VSocket({
        connection: window.location.hostname + ':3002'
    })
);

Vue.config.productionTip = false;

new Vue({
    render: (h) => h(Main)
}).$mount('#main');

import Vue from 'vue'
import Main from './Main'
import '/resources/css/app.css'
import VSocket from 'vue-socket.io';
import * as io from 'socket.io-client';

Vue.use(
    new VSocket({
        connection: io(window.location.hostname + ':3002'),
    })
);

Vue.config.productionTip = false

new Vue({
  render: h => h(Main)
}).$mount('#main')

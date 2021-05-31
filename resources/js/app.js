import Vue from 'vue'
import Main from './Main'
import '/resources/css/app.css'

Vue.config.productionTip = false

new Vue({
  render: h => h(Main)
}).$mount('#main')

import Vue from 'vue'
import Main from './Main'

Vue.config.productionTip = false

new Vue({
  render: h => h(Main)
}).$mount('#main')

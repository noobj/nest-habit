import Vue from 'vue'
import Dates from './components/Dates'

Vue.config.productionTip = false

new Vue({
  render: h => h(Dates)
}).$mount('#app')

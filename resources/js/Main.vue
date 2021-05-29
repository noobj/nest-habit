<template>
  <div id="main" class="flex flex-col items-center dark:text-white dark:bg-gray-800">
    <Menu />
    <Dates />
  </div>
</template>

<script>
import Dates from './components/Dates'
import Menu from './components/Menu'

export default {
  name: 'Main',
  components: {
    Menu,
    Dates
  },
  data () {
    return {
    }
  },
  methods: {
  }
}
</script>

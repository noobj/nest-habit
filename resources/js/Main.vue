<template>
  <div id="main" class="flex flex-col items-center dark:text-white dark:bg-gray-800">
    <div id="newRecord"></div>
    <Menu />
    <Dates />
    <Quote />
    <Search />
  </div>
</template>

<script>
import Search from './components/Search'
import Dates from './components/Dates'
import Menu from './components/Menu'
import Quote from './components/Quote'

export default {
  name: 'Main',
  components: {
    Menu,
    Dates,
    Search,
    Quote
  },
  data () {
    return {
    }
  },
  methods: {
  }
}
</script>

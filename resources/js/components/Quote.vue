<template>
  <div class="self-end max-w-xl mt-8 mr-12 opacity-25">
    <h2 class="italic text-right leading-normal">
      Don't take your thoughts too seriously
    </h2>
    <p class="text-right pt-4 text-grey-darker">
      - Eckhart Tolle
    </p>
  </div>
</template>

<script>
import {
  getDates,
  getSummaries
} from '../utils'

export default {
  name: 'Quote',
  data () {
    return {
      summaries: []
    }
  },
  sockets: {
  },
  methods: {
  },
  async mounted () {
  }
}
</script>

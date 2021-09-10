<template>
  <div class="self-end max-w-xl mt-8 mr-12 opacity-25">
    <h2 class="italic text-right leading-normal">
      {{ quote }}
    </h2>
    <p class="text-right pt-4 text-grey-darker">
      - {{ author }}
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
      quote: 'Don\'t take your thoughts too seriously',
      author: 'Eckhart Tolle'
    }
  },
  sockets: {
      quote: function(data) {
        const quote = JSON.parse(data);
        this.quote = quote.text;
        this.author = quote.author;
      }
  },
  methods: {
  },
  async mounted () {
  }
}
</script>

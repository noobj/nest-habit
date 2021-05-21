<template>
  <div
    class="date relative aspect-w-1 aspect-h-1 rounded-sm"
    :class="{
      0: 'bg-gray-200',
      1: 'bg-yellow-600',
      2: 'bg-yellow-700',
      3: 'bg-yellow-800',
      4: 'bg-yellow-900'
    }[summary.level]"
    :data-hover="hoverData"
  >
    <span
      v-if="showMonth"
      class="-mt-5 text-xs select-none lg:-mt-6 lg:text-sm"
    >
      {{ date | format('LLL') }}
    </span>
    <span
      v-if="showWeekday"
      class="flex items-center -ml-8 text-xs select-none lg:-ml-10 lg:text-sm"
    >
      {{ date | format('iii') }}
    </span>
  </div>
</template>

<script>
import { format } from 'date-fns'
export default {
  name: 'Date',
  props: {
    date: {
      type: Date,
      required: true
    },
    summary: {
      type: Object,
      default: () => {}
    },
    showMonth: {
      type: Boolean,
      default: false
    },
    showWeekday: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    hoverData () {
      return `${this.summary.duration} on ${format(this.date, 'MMM d, yyyy')}`
    }
  },
  filters: {
    getMediumDateStyle (date) {
      return new Intl.DateTimeFormat('en-US', { weekday: 'short', year: '2-digit', month: 'short', day: '2-digit' }).format(date)

    },
    format
  }
}
</script>

<style scoped>
.date:before {
  @apply absolute hidden z-20 py-1 px-2;
  @apply text-sm text-white whitespace-nowrap bg-gray-800 rounded;
  @apply transform -translate-x-1/2 -translate-y-full;
  content: attr(data-hover);
}
.date:hover:before {
  @apply block;
}
</style>

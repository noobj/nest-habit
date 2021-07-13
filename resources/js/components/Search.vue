<template>
  <div class="dark:text-white dark:bg-gray-800 mt-8 w-full">
      <VueTailwindPicker :start-date="startDate" class="inline" :theme="theme"
            @change="(v) => checkin = v"
        >
            <input class="text-black" type="text" v-model="checkin" placeholder="Example initial value"/>
        </VueTailwindPicker>

        <VueTailwindPicker class="inline" :theme="theme"
            @change="(v) => checkout = v"
        >
            <input class="text-black" type="text" v-model="checkout" placeholder="Example initial value"/>
        </VueTailwindPicker>
        <button class="inline flex-shrink-0 bg-purple-500 hover:bg-purple-700 border-purple-500 hover:border-purple-700
        text-sm border-4 text-white py-1 px-2 rounded" v-on:click="fetchSummaries()" type="button">Submit</button>
        <div id="mdiv" class="ml-8 cursor-pointer" v-if="chartToggl"
        v-on:click="chartToggl = false">
            <div class="mdiv">
                <div class="md"></div>
            </div>
        </div>
        <Chart v-click-outside="hide" v-if="chartToggl" :style="myStyles" :chart-data="chartData" :options="options">
        </Chart>
    </div>
  </div>
</template>

<script>
import { fetchOrRefreshAuth, getSummaries } from '../utils';
import VueTailwindPicker from 'vue-tailwind-picker';
import dayjs from 'dayjs';
import Chart from './Chart.vue';
import ClickOutside from 'vue-click-outside';

export default {
  name: "Search",
  props: {},
  components: {
    VueTailwindPicker, Chart
  },
  data() {
    return {
      chartData: {},
      options: {
        legend: {
            display: false,
        },
        responsive: true,
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        },
        maintainAspectRatio: false
      },
      myStyles: {
        height: '200px',
        width: '100%',
        position: 'relative',
      },
      startDate: dayjs().subtract(10, 'day').format('YYYY-MM-DD'),
      checkin: '',
      checkout: '',
      chartToggl: false,
      theme: {
        background: '#1A202C',
        text: 'text-white',
        border: 'border-gray-700',
        currentColor: 'text-gray-200',
        navigation: {
          background: 'bg-gray-800',
          hover: 'hover:bg-gray-700',
          focus: 'bg-gray-700',
        },
        picker: {
          rounded: 'rounded-md',
          selected: {
            background: 'bg-teal-400',
            border: 'border-teal-400',
            hover: 'hover:border-teal-400',
          },
          holiday: 'text-red-400',
          weekend: 'text-green-400',
          event: 'bg-blue-500',
        },
        event: {
          border: 'border-gray-700',
        },
      }
    };
  },
  methods: {
    hide () {
      this.chartToggl = false
    },
    async fetchSummaries() {
      this.chartToggl = true;
      const { summaries } = await getSummaries(this.checkin, this.checkout);
      const result = [];

      // render proper format for chart, fill up the empty dates
      for (let i = +dayjs(this.checkin); i < +dayjs(this.checkout); i = +dayjs(i).add(1, 'day')) {
        let duration = 0;
        const index = summaries.findIndex((summary) => summary.timestamp === i);
        if (index !== -1) {
          duration = this.convertFormatTimeToMinute(summaries[index].duration);
        }
        result.push({
          date: dayjs(i).format('MM-DD'),
          duration
        })
      }

      this.chartData = {
        labels: result.map(v => v.date),
        datasets: [
            {
                barPercentage: 0.2,
                label: 'sum',
                backgroundColor: '#004daa',
                data: result.map(v => v.duration)
            }
        ]
      }
    },
    convertFormatTimeToMinute(timestring) {
      console.log(typeof timestring);
      if (timestring.includes('h')) {
        const matches = timestring.match(/(\d+)h(\d+)m/);
        return 60 * +matches[1] + +matches[2];
      }

      const matches = timestring.match(/(\d+)m/);
      return +matches[1];
    }
  },
  mounted () {
    // prevent click outside event with popupItem.
    this.popupItem = this.$el;
  },
  directives: {
    ClickOutside
  }
}
</script>
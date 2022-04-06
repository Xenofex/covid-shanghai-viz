import {pointLayer, map} from "./map_canvas.mjs"

let vueUrl = 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
if (location.href.match(/.*\.com/)) {
  vueUrl = 'https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js';
}

const Vue = await import(vueUrl)

const geocoder = new BMapGL.Geocoder()

// 不明原因，该组件如果移动到map_canvas.mjs，将会不起作用
const autocomplete = new BMapGL.Autocomplete({
  input: 'address-search'
})

autocomplete.addEventListener('onconfirm', (e) => {
  console.log('on autocomplete confirm: ', e)
  // const location = e.item.value
  const address = document.getElementById('address-search').value
  geocoder.getPoint(address, (point) => {
    map.clearOverlays()
    const marker = new BMapGL.Marker(point, {
      icon: new BMapGL.Icon('marker.svg', new BMapGL.Size(20, 28.4))
    })
    map.addOverlay(marker)
    map.centerAndZoom(point)
  })

  // map.centerAndZoom(document.getElementById('address-search').value)
})

Vue.createApp({
  data() {
    return {
      currentDate: undefined,
      dates: [],
    }
  },

  async mounted() {
    await Promise.all([this.loadAddressMap(), this.loadDataJson()])

    this.dates = Object.keys(this.rawData)
    this.setDate(this.dates[this.dates.length-1])
  },

  methods: {
    async loadDataJson() {
      const r1 = await fetch('data.json')
      this.rawData = await r1.json()
    },

    async loadAddressMap() {
      const r2 = await fetch('addressMap.json')
      this.addressMap = await r2.json()  
    },

    setDate(date) {
      this.currentDate = date

      const values = this.rawData[date]
      const data = []
  
      for (const districtName in values) {
        const district = values[districtName]
        const { addresses } = district
        
        for (const address of addresses) {
          const fullAddress = districtName + address
          const location = this.addressMap[fullAddress]
  
          if (location) {
            data.push({
              geometry: {
                type: 'Point',
                coordinates: [location.lng, location.lat]
              },
              properties: {
                text: fullAddress.replace(/[，。]/, '')
              }
            })
          }
        }
      }
  
      pointLayer.setData(data);
    }
  }
}).mount('#sidebar')


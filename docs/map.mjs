import {pointLayer, markerListLayer, map} from "./map_canvas.mjs"
import { sortDate } from "./sort_date.mjs";


let vueUrl = 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
if (location.href.match(/.*\.com|github\.io/)) {
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

const { ref, onMounted, watch, computed } = Vue

Vue.createApp({
  setup() {
    const currentDate = ref()
    const dates = ref([])
    const mapType = ref('case-location')
    const rawData = ref()

    let addressMap

    async function loadDataJson() {
      let dataUrl = 'data.json'
      if (location.href.includes('github.io')) 
        dataUrl = "https://media.githubusercontent.com/media/Xenofex/covid-shanghai-viz/master/docs/data.json"

      const r1 = await fetch(dataUrl, { mode: 'no-cors' })
      rawData.value = await r1.json()
    }

    async function loadAddressMap() {
      let addressMapUrl = 'addressMap.json'
      if (location.href.includes('github.io'))
        addressMapUrl = "https://media.githubusercontent.com/media/Xenofex/covid-shanghai-viz/master/docs/addressMap.json"
      const r2 = await fetch(addressMapUrl, { mode: 'no-cors' })
      addressMap = await r2.json()
    }


    function caseLocationData(date) {
      const values = rawData.value[date]
      const data = []
  
      for (const districtName in values) {
        const district = values[districtName]
        const { addresses } = district
        
        for (const address of addresses) {
          const fullAddress = districtName + address
          const location = addressMap[fullAddress]
  
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

      return data
    }

    const districtCenterMap = {}
    async function getDistrictCenter(name) {
      if (!districtCenterMap[name]) {
        districtCenterMap[name] = await new Promise(resolve => {
          geocoder.getPoint('上海市' + name, function(point) {
            resolve(point)
          })
        })
        
      }

      return districtCenterMap[name]
    }

    async function districtData(date, extractor) {
      const result = []
      const dataOfDay = rawData.value[date]
      for (const districtName in dataOfDay) {
        const count = extractor(dataOfDay[districtName])
        
        const {lat,lng} = await getDistrictCenter(districtName)
        result.push({
          geometry: {
              type: 'Point',
              coordinates: [lng, lat]
          },
          properties: {
              text: `${districtName}\n${count}`
          }
        })

      }
    
      return result
    }

    onMounted(async () => {
      await Promise.all([loadAddressMap(), loadDataJson()])

      dates.value = Object.keys(rawData.value).sort(sortDate)
      currentDate.value = dates.value[dates.value.length-1]
    })

    async function reloadData() {
      const date = currentDate.value
      switch(mapType.value) {
        case 'case-location':
          pointLayer.setData(caseLocationData(date))
          markerListLayer.setData([])
          break;
        case 'district-statistics-symptomatic':
          pointLayer.setData([])
          markerListLayer.setData(await districtData(date, ({cases}) => cases))
          break;
        case 'district-statistics-asymptomatic':
          markerListLayer.setData(await districtData(date, ({asymptomaticCases}) => asymptomaticCases))
          pointLayer.setData([])
          break;
        case 'district-statistics-total':
          markerListLayer.setData(await districtData(date, ({cases, asymptomaticCases}) => cases + asymptomaticCases))
          pointLayer.setData([])
          break;
      }
    }

    watch(mapType, reloadData)
    watch(currentDate, reloadData)

    const dataOfCurrentDate = computed(() => rawData.value && rawData.value[currentDate?.value])
    const totalOfCurrentDate = computed(() => {
      let totalCases = 0, totalAsymptomaticCases = 0
      for (const district in dataOfCurrentDate.value) {
        const { cases, asymptomaticCases } = dataOfCurrentDate.value[district] || {}
        totalCases += cases || 0
        totalAsymptomaticCases += asymptomaticCases || 0
      }

      return { totalCases, totalAsymptomaticCases }
    })

    return {
      currentDate,
      dates,
      mapType,
      dataOfCurrentDate,
      totalOfCurrentDate,
      allDistricts: [
        '浦东新区', '黄浦区', '静安区', '徐汇区',
        '长宁区', '普陀区', '虹口区', '杨浦区',
        '宝山区', '闵行区', '嘉定区', '金山区',
        '松江区', '青浦区', '奉贤区', '崇明区',
      ]
    }
  },

}).mount('#sidebar')


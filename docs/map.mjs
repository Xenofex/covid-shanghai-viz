import { setupChart } from "./chart.mjs";
import { pointLayer, markerListLayer, map } from "./map_canvas.mjs"
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
    const rawData = ref({})
    
    async function loadData(date) {
      if (rawData.value[date]) {
        return rawData.value[date]
      } else {
        return rawData.value[date] = await (await fetch(`data/${date}.json`)).json()
      }
    }
    
    const dataOfCurrentDate = computed(() => currentDate.value && rawData.value[currentDate.value])

    async function caseLocationData(date) {
      const values = await loadData(date)
      const data = []
  
      for (const districtName in values) {
        const district = values[districtName]
        const { addressWithLocation } = district
        
        for (const [address, lat, lng] of addressWithLocation) {
  
          if (location) {
            data.push({
              geometry: {
                type: 'Point',
                coordinates: [lng, lat]
              },
              properties: {
                text: address.replace(/[，。]/, '')
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
      const dataOfDay = await loadData(date)
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
      dates.value = await (await fetch('dates.json')).json()
      dates.value.sort(sortDate)
      currentDate.value = dates.value[dates.value.length-1]
      setupChart({
        onClick({dataIndex}) {
          currentDate.value = dates.value[dataIndex]
        }
      })
    })

    async function reloadData() {
      const date = currentDate.value
      switch(mapType.value) {
        case 'case-location':
          pointLayer.setData(await caseLocationData(date))
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


let vueUrl = 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
if (location.href.match(/.*\.com/)) {
  vueUrl = 'https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js';
}

const Vue = await import(vueUrl)

const map = initMap({
  heading: 0,
  zoom: 11,
  center: [121.487899486, 31.24916171],
  // style: whiteStyle,
  skyColors: [
      // 地面颜色
      'rgba(226, 237, 248, 0)',
      // 天空颜色
      'rgba(186, 211, 252, 1)'
  ]
});

const view = new mapvgl.View({
  // effects: [new mapvgl.BloomEffect({
  //     threshold: 0.7,
  //     blurSize: 2
  // })],
  map: map
});

const textLayer = new mapvgl.TextLayer({
  color: 'black',
  offset: [0, -15]
})
view.addLayer(textLayer)

const pointLayer = new mapvgl.PointLayer({
  size: 5,
  color: '#ac3370aa',
  enablePicked: true, // 是否可以拾取
  selectedIndex: -1, // 选中数据项索引
  selectedColor: '#ff0000', // 选中项颜色
  // autoSelect: true, // 根据鼠标位置来自动设置选中项
  // onClick: (e) => { // 点击事件

  // },
  onMousemove(e) {
    if (e.dataIndex < 0) {
      textLayer.setData([])
      pointLayer.setOptions({selectedIndex: -1})
    } else {
      pointLayer.setOptions({selectedIndex: e.dataIndex})
      textLayer.setData([{
        ...e.dataItem,
      }])
    }
}
});
view.addLayer(pointLayer);

var locationControl = new BMapGL.LocationControl({
  // // 控件的停靠位置（可选，默认左上角）
  // anchor: BMAP_ANCHOR_TOP_RIGHT,
  // // 控件基于停靠位置的偏移量（可选）
  // offset: new BMapGL.Size(20, 20)
});
// 将控件添加到地图上
map.addControl(locationControl);


map.setDefaultCursor('default');

const geocoder = new BMapGL.Geocoder()

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


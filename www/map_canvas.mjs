import { initMap } from './common.mjs' 
import { MenuControl } from './menu_control.mjs';

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

export const pointLayer = new mapvgl.PointLayer({
  size: 5,
  color: '#ac3370aa',
  enablePicked: true, // 是否可以拾取
  selectedIndex: -1, // 选中数据项索引
  selectedColor: '#ff0000', // 选中项颜色
  // autoSelect: true, // 根据鼠标位置来自动设置选中项
  onClick(e) { // 点击事件
    const sidebar = document.getElementById('sidebar')
    sidebar.classList.add('collapsed')
    sidebar.querySelector('input').blur()
    this.onMousemove(e)
  },
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

map.addControl(new BMapGL.LocationControl({
  // 控件的停靠位置（可选，默认左上角）
  anchor: BMAP_ANCHOR_TOP_LEFT,
  // 控件基于停靠位置的偏移量（可选）
  offset: new BMapGL.Size(10, 10)
}));

map.addControl(new MenuControl({
  onClick(e) {
    console.log('menu clicked')
    document.getElementById('sidebar').classList.toggle('collapsed')
  }
}))
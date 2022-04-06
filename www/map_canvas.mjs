import { MenuControl } from './menu_control.mjs'
import { initMap } from "./common.mjs"

export const map = initMap({
  heading: 0,
  zoom: 11,
  center: [121.487899486, 31.24916171], //上海市中心
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



export const pointLayer = new mapvgl.PointLayer({
  size: 5,
  color: '#ac3370aa',
  enablePicked: true, // 是否可以拾取
  selectedIndex: -1, // 选中数据项索引
  selectedColor: '#ff0000', // 选中项颜色
  // autoSelect: true, // 根据鼠标位置来自动设置选中项
  onClick(e) { // 点击事件
    document.getElementById('sidebar').classList.add('collapsed')
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

const textLayer = new mapvgl.TextLayer({
  color: 'black',
  offset: [0, -15]
})
view.addLayer(textLayer)

var locationControl = new BMapGL.LocationControl({
  // // 控件的停靠位置（可选，默认左上角）
  anchor: BMAP_ANCHOR_TOP_LEFT,
  // // 控件基于停靠位置的偏移量（可选）
  offset: new BMapGL.Size(10, 10)
});
// 将控件添加到地图上
map.addControl(locationControl);

map.addControl(new MenuControl({
  onClick(e) {
    document.getElementById('sidebar').classList.toggle('collapsed')
  }
}))

map.setDefaultCursor('default');

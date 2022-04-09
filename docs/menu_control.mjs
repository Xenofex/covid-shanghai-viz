export function MenuControl({onClick}){    
  // 设置默认停靠位置和偏移量  
  this.defaultAnchor = BMAP_ANCHOR_TOP_LEFT;    
  this.defaultOffset = new BMapGL.Size(10, 60);    
  this.onClick = onClick
}    
// 通过JavaScript的prototype属性继承于BMap.Control   
MenuControl.prototype = new BMapGL.Control();

MenuControl.prototype.initialize = function(map){    
  // 创建一个DOM元素   
  var div = document.createElement("div");
  div.id = 'menu-control'
  const img = document.createElement('img')
  img.src = 'Hamburger_icon.svg'
  div.appendChild(img)
  div.onclick = this.onClick

  // 添加DOM元素到地图中   
  map.getContainer().appendChild(div);    
  // 将DOM元素返回  
  return div;    
}

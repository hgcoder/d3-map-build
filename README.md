# d3-map-build 基于 D3.js(v4) 的地图绘制工具
```js
import SE from "d3-map-buid"; 
``` 
```js
new SE.map({
   areaData: mapInfo.areaData,
   container: "JD3MapList",
   mapUrl: mapInfo.mapUrl,
   mapCentre: mapInfo.mapCentre || [104.3, 28.425],
   mapScale: mapInfo.mapScale || 550,
   gOffset: mapInfo.gOffset,
   mouseoverCallBack: function(d) {
   },
   clickCallBack: mapInfo.clickCallBack || null,
   zoomCfg: {
   },
   initStatus: function() {
   }  
}); 
``` 

```html
    mapUrl 地图geoJson 文件地址 必传
    mapCentre 投影中心位置 [] 规则 地址位置东经，北纬边界范围和的平均值 必传
    例：江苏省 东经116.3036—121.9661   北纬30.7531--35.3364  江苏的 mapCentre = [(116.3036+121.9661)/2, (30.7531+35.3364)/2]
    mapScale 地图缩放比例  Num 规则 根据页面区域大小改变  范围 100 - 8000 必传
    initStatus 地图绘制完成以后执行的方法 FUN
    zoomConf 缩放配置 {}
    例：{scaleExtent: [],
       zoomCallBack:FUNCTION,
       scaleExtent 支持的缩放比例范围默认0-10倍，
       zoomCallBack 缩放事件回调
     }
    mapUICfg 地图展示相关UI 配置 {}
    例：mapUICfg.fillColorRange : ['#fff', '#ff0000']， mapUICfg.stroke:'#e4e5f2'
    areaData 真实数据 [] 对应地图区域展示数据 每一条的area，value字段必传分别表示区块名称和数值
    且区块名称需要和地图文件数据里面的item.properties.name对应
    例：[{"area":"湖州市","value":"9"}]
    clickCallBack 对应地图区域点击事件回调
    mouseoverCallBack 鼠标hover 事件回调
    mouseoutCallBack 鼠标移出 事件回调
    closeMapName boolean 是否关闭默认省市名称
    closeMapPointer boolean 是否关闭对默认应省市对应的点
    closeColorSign boolean 是否关闭默认颜色标志模块
    diyPointerCfg 自定义点配置信息 {}
    例： diyPointerCfg.pointerLists [{"dtValue":"","name":"北京","cp":[116.24,39.55]}] 点信息
         diyPointerCfg.pointerClickCB FUNCTION
    
``` 

/**
 *
 * @authors huxiao (you@example.org)
 * @version $Id$
 */
import Base from './base'
import gradient from './util/gradient'

/**
 *   mapUrl 地图geoJson 文件地址 必传
 *   mapCentre 投影中心位置 [] 规则 地址位置东经，北纬边界范围和的平均值 必传
 *   例：江苏省   东经116.3036—121.9661   北纬30.7531--35.3364
 *   mapScale 地图缩放比例  Num 规则 根据页面区域大小改变  范围 100 - 8000 必传
 *   initStatus 地图绘制完成以后执行的方法 FUN
 *   zoomConf 缩放配置 {}
 *   例：{scaleExtent: [],
 *      zoomCallBack:FUNCTION,
 *      scaleExtent 支持的缩放比例范围默认0-10倍，
 *      zoomCallBack 缩放事件回调
 *    }
 *   mapUICfg 地图展示相关UI 配置 {}
 *   例：mapUICfg.fillColorRange : ['#fff', '#ff0000']， mapUICfg.stroke:'#e4e5f2'
 *   areaData 真实数据 [] 对应地图区域展示数据 每一条的area，value字段必传分别表示区块名称和数值
 *   且区块名称需要和地图文件数据里面的item.properties.name对应
 *   例：[{"area":"湖州市","value":"9"}]
 *   clickCallBack 对应地图区域点击事件回调
 *   mouseoverCallBack 鼠标hover 事件回调
 *   mouseoutCallBack 鼠标移出 事件回调
 *   closeMapName boolean 是否关闭默认省市名称
 *   closeMapPointer boolean 是否关闭对默认应省市对应的点
 *   closeColorSign boolean 是否关闭默认颜色标志模块
 *   diyPointerCfg 自定义点配置信息 {}
 *   例： diyPointerCfg.pointerLists [{"dtValue":"","name":"北京","cp":[116.24,39.55]}] 点信息
 *        diyPointerCfg.pointerClickCB FUNCTION
 */
export default class map extends Base {
  constructor(props) {
    super(props)
    this.mapUrl = props.mapUrl || ''
    this.mapCentre = props.mapCentre
    this.mapScale = props.mapScale
    this.gOffset = props.gOffset
    this.zoomConf = props.zoomCfg
    this.initStatus = props.initStatus
    this.clickCallBack = props.clickCallBack || null
    this.mouseoverCallBack = props.mouseoverCallBack || null
    this.mouseoutCallBack = props.mouseoutCallBack || null
    this.areaData = props.areaData
    this.closeMapName = props.closeMapName
    this.closeMapPointer = props.closeMapPointer
    this.closeColorSign = props.closeColorSign
    this.diyPointerCfg  = props.diyPointerCfg
    this.mapUICfg  = props.mapUICfg
    this.init()
  }
  init() {
    const that = this;
    // 1、定义投影方式
    const project=this.project = d3.geoMercator()
      .center(this.mapCentre) // 投影的中心位置
      .scale(this.mapScale) // 地图缩放
      .translate([(this.conf.width - (this.gOffset ? this.gOffset[0] : 0)) / 2,
        (this.conf.height - (this.gOffset ? this.gOffset[1] : 0)) / 2])
    // 2、定义地理路径生成器
    this.path = d3.geoPath(project)
    d3.json(this.mapUrl, (error, root) => {
      if (error) {
        return console.error(error)
      }
      // 加入真实数据
      if (this.areaData) {
        for (let i = 0; i < this.areaData.length; i++) {
          let name = this.areaData[i].area,
            mapData = this.areaData[i].value;
          root.features.some((item,index)=>{
            if (name.indexOf(item.properties.name) != -1) {
              item.dtValue = mapData
              return;
            }
          })
        }
      } else {
        root.features.map((item,index)=>{
          //在地图json里塞入默认数据
          item.dtValue =''
        })
      }
      // 颜色填充相关
      this.mapFill(root)
      // 地图区域绘制
      this.wrapperG.append('g')
        .attr('id', 'mapG')
        .selectAll('path')
        .data(root.features)
        .enter()
        .append('path')
        .attr('stroke', this.mapUICfg.stroke)
        .attr('stroke-width', 1)
        .attr('d', this.path)
        .attr('fill', (d) => {
          return that.colorFun(that.colorLinear(d.dtValue || 0)).toString()
        })
        .on('mouseover', (d, index) => {
          if (this.mouseoverCallBack) {
            this.mouseoverCallBack.bind(this)(d);
          }
        })
        .on('mouseout',(d, index)=>{
          if (this.mouseoutCallBack) {
            this.mouseoutCallBack.bind(this)(d);
          }
        })
        .on('click', (d, index) => {
          if (that.clickCallBack) {
            that.clickCallBack.bind(this)(d)
          }
        })
        .call((d, index) => {
          if (this.initStatus) {
            this.initStatus.bind(this)(d,index)
          }
        })
      // 地图缩放处理 拖动
      if (this.zoomConf) {
        let defaultCfg = {
          /**
           * 支持配置项
           * 缩放范围，scaleExtent
           * zoom事件回调， zoomCallBack
           */
          scaleExtent: [0, 10],
          zoomCallBack: function () { }
        },
        cfg = Object.assign(defaultCfg, this.zoomConf),
        zoom = d3.zoom()
          .scaleExtent(cfg.scaleExtent)
          .on('zoom', zoomCB);
        // 1、选取整个画布进行缩放
        this.svg.call(zoom)
        function zoomCB() {
          d3.select('#wrapperG').attr("transform", d3.event.transform)
          cfg.zoomCallBack.bind(this)() // 缩放事件接口暴露
        }
        // 这里有个坑 当缩放直接绑定到g元素上时 mousedonw.zoom 拖动功能抖动犀利
        // 建议使用 1、的模式进行缩放
        // d3.select('#wrapperG')
        //   .call(zoom)
      }
      if (!this.closeMapName){
        // 省市名称绘制
        this.wrapperG.append('g')
          .attr('id', 'cityNameG')
          .selectAll('text')
          .data(root.features)
          .enter()
          .append('text')
          .attr('transform', (d) => {
            let x = this.path.centroid(d)[0],
              y = this.path.centroid(d)[1]-5;
            // 调整 河北 ，天津, 甘肃文字
            if (d.properties.id == 13){
              y = y+20;
            }
            if(d.properties.id == 62){
              y = y-10;
            }
            if (d.properties.id == 12){
              x = x+15;
            }
            if (d.properties.id == 81){
              y = y+20;
              x = x+10;
            }
            if(d.properties.id == 82){
              y = y+10;
              x = x-10;
            }
            return 'translate(' + x + ',' + y + ')'
          })
          .html((d) => {
            return '<tspan x=-15>' + d.properties.name + '</tspan>'
          })
          .attr('font-size', 12)
          .attr('fill', '#898DC8')
      }
      if (!this.closeMapPointer){
        // 展示点绘制
        this.wrapperG.append('g')
          .attr('id', 'pointerG')
          .selectAll('circle')
          .data(root.features)
          .enter()
          .append('circle')
          .attr('transform', (d) => {
            let x = this.path.centroid(d)[0],
              y = this.path.centroid(d)[1];
            // 调整甘肃id 62 点位置
            if (d.properties.id == 62) {
              y = y - 10;
            }
            return 'translate(' + x + ',' + y + ')'
          })
          .attr('r', 3)
          .attr('opacity', .6)
          .attr('fill', '#898DC8')
      }
      if (!this.closeColorSign){
        this.colorSign()
      }
      if (this.diyPointerCfg){
        this.drawPointer()
      }
    })
  }
  mapFill(root) {
    let dtMax,
      dtMin = 0,
      lightColor,
      darkColor,
      colorFun,
      colorLinear;
    // 颜色配置
    this.lightColor = lightColor= d3.rgb(this.mapUICfg.fillColorRange[0] ) || 255,255,255,1;
    this.darkColor = darkColor = d3.rgb(this.mapUICfg.fillColorRange[1] ) ||  98,216,216,1;
    this.colorFun = colorFun = d3.interpolate(lightColor, darkColor);
    dtMax = d3.max(root.features, (d) => {
      return d.dtValue
    })
    this.colorLinear = colorLinear = d3.scaleLinear()
      .domain([dtMin, dtMax])
      .range([0, 1])
  }
  colorSign() {
    // 颜色标志模块
    const that = this;
    let gradientId,signG, signWidth = 200, signHeight = 12;
    // 生成渐变
    gradientId = 'mapGraDientMaker' + Math.random(10)*100;
    let gra = new gradient({
      defs: that.svg.append('defs'),
      id: gradientId,
      graType: 'linearGradient',
      colorRange: [this.lightColor,this.darkColor]
    })
    //颜色标志模块包裹元素统一管理位置
    signG = this.svg.append('g')
      .attr('id', '#colorSignG')
      .attr('transform', 'translate(20,' + (that.conf.height - 60) + ')');// 颜色标志位置偏移
    signG.append('text')
      .attr('transform', 'translate(0,-15)')
      .html(() => {
        return '<tspan fill="#000" opacity=".65">准确率:</tspan>'
      })
    signG.append('rect')
      .attr('rx', '8')
      .attr('ry', '8')
      .attr('width', signWidth)
      .attr('height', signHeight)
      .attr('fill', "url(#"+gradientId+")")
    signG.append('text')
      .attr('transform', 'translate(0, 35)')
      .html(() => {
        return '<tspan fill="#000" opacity=".35">低</tspan> <tspan  fill="#000" opacity=".35" dx="' + (signWidth - 29) + '">高</tspan>'
      })
  }
  drawPointer(){
    // 根据经纬度画位置
    const that = this;
    this.wrapperG.append('g')
      .attr('id', 'diyPointerG')
      .selectAll('.diyPointerLink')
      .data(that.diyPointerCfg.pointerLists)
      .enter()
      .append('circle')
      .attr('class','.diyPointerLink')
      .attr('transform', (d)=>{
        // 调整佛山， 香港， 广州，东莞，中山 大区位置
        let x,y;
        x = this.project(d.cp)[0];
        y = this.project(d.cp)[1];
        if (d.name == '香港'){
          y = y+5
        }
        if (d.name == '佛山'){
          y = y-5
        }
        if (d.name == '广州'){
          y = y+5
        }
        if (d.name == '中山'){
          y = y+5
        }
        return 'translate('+x+ ',' +y+ ')'
      })
      .attr('r', that.diyPointerCfg.pointerUI.r || 6)
      .attr('opacity', .6)
      .attr('fill', that.diyPointerCfg.pointerUI.fill)
      .on('mouseover',  (d)=>{
        let tipG = this.wrapperG
          .append("g")
          .attr("class", "diyPointerTipG")
          .attr("transform", () => {
            let x,y;
            x = this.project(d.cp)[0];
            y = this.project(d.cp)[1]+5;
            return "translate(" + x + "," + y + ")";
          });
        tipG
          .append("rect")
          .attr("width", 180)
          .attr("height", 80)
          .attr("fill", "#000")
          .attr("opacity", "0.6")
          .attr("rx", 6)
          .attr("ry", 6);
        tipG
          .append("text")
          .attr("transform", "translate(20,30)")
          .attr("fill", "#fff")
          .attr("font-size", "14px")
          .html(() => {
            // dx dy 字体位置偏移
            return (
              "<tspan> " +
              d.name +
              '大区</tspan><tspan y="27" x="0">预测销量：' +
              (d.dtValue || "") +
              "</tspan>"
            );
          });
      })
      .on('mouseout', function (d) {
        d3.select('.diyPointerTipG').remove()
      })
      .on('click',  function(d) {
        let circel =  d3.select(this);
        // 清空上个节点 transition效果
        if (that.preThis){
          d3.select(that.preThis)
            .transition()
            .empty()
        }
        d3.selectAll('.diyPointerLink')
          .attr('r', that.diyPointerCfg.pointerUI.r || 6)
        circel
          .transition()
          .on('start', function repeat() {
            //创建链式转换
            d3.active(this)
              .attr('r', that.diyPointerCfg.pointerUI.r || 6)
              .transition()
              .duration(550)
              .attr('r',12)
              .ease(d3.easeLinear)
              .transition()
              .on('start', repeat)
              // bug *** 无法重置 上个点击circle元素的半径
              // .on('interrupt', function () {
              //   // 当transition被打断时 重置图形半径
              //   d3.select(this).attr('r', 4)
              // })
              // .on('end', function () {
              //   d3.select(this).attr('r', 4)
              // })
          })
          that.preThis = this;
          if (that.diyPointerCfg.pointerClickCB){
            that.diyPointerCfg.pointerClickCB.bind(that)(d)
          }
        }
      )
      .call(()=>{
        console.log('自定义点绘制完成')
        if(this.diyPointerCfg.initStatus)
          this.diyPointerCfg.initStatus.bind(this)()
      })
  }
}

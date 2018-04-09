/**
 *
 * @authors hgcoder(you@example.org)
 * @version $Id$
 */

/**全局配置详情 
 * container 图形容器 必传 id 'app'
 * color pie区块对应颜色配置Array [,,,,]
 * pieData pie图形数据用于生成pie [] pieData.lenght
 * lineConf pie区块对应指示线配置
 * lineConf.pointer [{x,y}] 指示线经过的点的坐标  必传
 * gOffset 绘制图形中心点的位置偏移 [x,y]
 */
import Base from './base'

export default class commonArc extends Base {
  defaultConf () {
    return {}
  }
  constructor(props) {
    super(props)
    this.pieData = props.data || []
    this.pieConfig = props.conf || []
    this.color = props.color || ['#f8f7cc', '#ff8960']
    this.gOffset = props.gOffset
    this.circleOrigin = [] // 指示线结束点位置 说明文字及legend用到
    this.init()
  }
  init() {


    this.centerG = this.svg.append('g') // 当前dom 中心点为坐标的g元素
      .attr('transform', 'translate(' 
        + (this.conf.width- (this.gOffset ? this.gOffset[0] : 0)) / 2 + ',' 
        + (this.conf.height - (this.gOffset ? this.gOffset[1] : 0)) / 2 + ')')

    /**
     * 节点配置信息和数据信息整合
     * 方便饼图区块绘制时去自定义属性
     * @return {[type]}     [description]
     */
    for (var i = 0; i < this.pieData.length; i++) {
      this.pieData[i].map((item, index) => {
        this.pieData[i][index] = Object.assign(this.pieData[i][index], this.pieConfig[i][index])
      })
    }

    /**
     * 饼图绘制流程
     */
    for (var i = 0; i < this.pieData.length; i++) {

      /**
       * pieDealData:根据传入的图形，通过d3.pie生成的的固定格式的数据，用于pie区块生成。
       * @type {[Array]}
       */
      let pieDealData = d3.pie()
        .value(item => {
          return item.value
        })(this.pieData[i]) // 每个环（内环 || 外环）的数据的 This.pieData 是个数组
      this.drawPie(pieDealData) // 饼图区块
      this.drawExpLine(pieDealData, i) // 指示线
      this.drawLegend(pieDealData, i) //说明

    }

    if (this.showLegend) {
      
      pieDealData.map((item, index) => {
        legendG
          .append('text')
          // 设置文字及react位置提示
          .attr("transform", function() {
            return 'translate(30,' + (index * 36 + 16) + ')' // 35为提示位置与rect边距
          })
          .html(function() {
            if (index == 0) {
              return '<tspan font-size="16" x=0 y=-50 fill="#95c6ed">' + item.data.time.slice(0, 4) +
                '</tspan>' +
                '<tspan x=0 y=0  font-size="16">' + (item.data.name || item.data.areaName) + ' ' +
                item.data.ratio + item.data.unitName + '</tspan>'
            } else {
              return '<tspan font-size="16" x=0 y=0 fill="#95c6ed"></tspan>' +
                '<tspan x=0 y=0 font-size="16">' + (item.data.name || item.data.areaName) +
                ' ' + item.data.ratio + item.data.unitName + '</tspan>'
            }
          })
          .attr("font-size", 16)
          .attr("fill", "#b8c3c3")
          .attr('box-raduis', "3px")

      })

    }

  }
  /**
   * [drawPie pie图形绘制流程]
   * @param  {[Array]} data [生成pie图形数据]
   * @return {[type]}      [description]
   */
  drawPie(data) {
    let pieDealData = data
    const This = this
    //存放pie图形信息g元素
    let pieBox = this.centerG.append('g')
      .attr('class', 'pieBox')
    // 定义pie图形信息
    this.arcDefine = d3.arc()
      .innerRadius(function(d) {
        return d.data.r ? d.data.r[0] : 0
      })
      .outerRadius(function(d) {
        return d.data.r ? d.data.r[1] : 0
      })
      .padAngle(function(d) {
        // 支持padAngle 可配置
        return d.data.padAngle || 0
      })

    // 饼图绘制
    pieBox
      .selectAll('._pie')
      .data(pieDealData)
      .enter()
      .append('path')
      .classed('_pie', true)
      .attr('d', (d)=> {
        return This.arcDefine(d)
      })
      .attr('stroke', function(d) {
        if (d.data.strokeColor) {
          return d.data.strokeColor
        } else {
          return 'none'
        }
      })
      .attr('stroke-width', function(d) {
        // 可配置 边框
        if (d.data.strokeWidth) {
          return d.data.strokeWidth
        } else {
          return 0
        }
      })
      .attr('fill', (d) => {
        if (d.data.color) {
          return d.data.color
        }
        return This.color[d.data.index]
      })
      .attr('fill-opacity', function(d) {
        // 可配置透明度
        if (d.data.opacity) {
          return d.data.opacity
        } else {
          return '1'
        }
      })

  }
  /**
   * [drawExpLine pie 区域说明功能绘制]
   * @param  {[Array]} data [description]
   * @param  {[Array]} index [第几条pie数据]
   * @return {[type]}      [description]
   */
  drawExpLine(data, index1) {
    const This = this
    let pieDealData = data

    /**
     * [线绘制方法]
     * @param  {[Object]} item [description]
     * @return {[type]}      [description]
     */
    const lineMarker = (item, lineType) => {
      let expLineBox = this.centerG.append('g')
        .attr('class', 'expLineBox')
      // 定义线
      let canvas = d3.path();
      // 线起点
      let c = this.arcDefine.centroid(item)
      let startX = c[0] // 点起点横坐标
      let startY = c[1] // 点起点纵坐标
      let conf = item.data.lineConf
      let co = conf.centerOffset || [] //线起点偏移位置
      let pList = conf.pointer // 指示线经过的位置
      // let circleOrigin = [] // 圆心坐标

      // 绘制线路径
      const drawPath = (context) => {
        if (co &&
          co instanceof Array &&
          co.length > 1) {
          /**
           * 设置线起点位置
           * @type {[type]}
           */
          startX = c[0] - co[0]
          startY = c[1] - co[1]
        }
        context.moveTo(startX, startY)
        // 支持折线

        if (pList &&
          pList instanceof Array &&
          pList.length > 1) {
          for (var h = 0; h < pList.length; h++) {
            context.lineTo(pList[h].x, pList[h].y)
          }
          This.circleOrigin = [pList[pList.length - 1].x, pList[pList.length - 1].y] //设置圆起点
        } else if (pList && pList.length == 1) {
          //直线 当线为直线的时候y坐标为线起点的y坐标
          context.lineTo(pList[0].x, startY)
          This.circleOrigin = [pList[0].x, startY] //设置圆起点
        }
      }
      // 绘制
      drawPath(canvas)
      // 添加线
      expLineBox.append('path')
        .attr('d', canvas.toString())
        .attr('stroke-width', '1px')
        .attr('stroke', '#eeeeef')
        .attr('fill', 'none')
      // 指引线后圆的绘制
      if (!lineType) {
        expLineBox.append('circle')
          .attr('cx', This.circleOrigin[0])
          .attr('cy', This.circleOrigin[1])
          .attr('r', 5)
          .attr('fill', '#fff')
      }
      // 指引线后的文字绘制
      expLineBox.append('text')
        .attr('transform', function() {
          return 'translate(' + This.circleOrigin[0] + ',' + This.circleOrigin[1] + ')'
        })
        .html(function(d) {

          if (lineType && lineType == 'lineType1') {
            //  图形类型为lineType1 画线
            if ((index1 == (This.pieData.length - 1) && index1 != 1)
              || item.data.linConf && (tem.data.lineConf.textAlign == 'right')) {
              return '<tspan x=-70 y= -15>' + item.data.area + '</tspan>'
            }
            return '<tspan x = 15 y= -15>' + item.data.area + '</tspan>'
          }
          if ((index1 == (This.pieData.length - 1) && index1 != 1)
            || item.data.lineConf && (item.data.lineConf.textAlign == 'right')) {
            // 图形最后一个圆环 字体位置
            return '<tspan x=10 y=-13 fill="#45bae0">'
            +item.data.name+'</tspan><tspan x=10 y=25>'
            +item.data.type+':'
            +item.data.ratio
            +item.data.unit+ '</tspan>'
          }
          return '<tspan x=-70 y=-13 fill="#45bae0">' 
            +item.data.name+'</tspan><tspan x=-70 y=25>'
            +item.data.type+':'
            +item.data.ratio
            +item.data.unit+ '</tspan>'
        })
        .attr('font-size', 16)
        .attr('fill', '#fff')
    }
    let confType1 = pieDealData[0].data.lineConf
    if (confType1 && confType1.type == 'lineType1') {
      // lineType 为1的情况下一个圆环对应一条直线 默认取第一条配置信息
      lineMarker(pieDealData[0], 'lineType1')
      return
    }
    /**
     * pie区块解释功能流程
     * @param  {[type]} 
     * @return {[type]}     [description]
     */
    pieDealData.map((item, index) => {
      if (item.data.lineConf &&
        item.data.lineConf.pointer) {
        lineMarker(item)
      }
    })
  }
  drawLegend(data, index1) {
    /**
     * legend 的绘制流程
     * @param {Num}  [index] [圆环标识判断当前第几环，用于调整说明文字位置]
     * @type {[type]}
     */
    if (!data[0].data.name){
      return
    }
    let ofx, ofy;
    if(index1 == this.pieData.length-1){
      ofx = this.circleOrigin[0]-150
      ofy = this.circleOrigin[1]+25
    } else {
      ofx = this.circleOrigin[0]
      ofy = this.circleOrigin[1]+25
    }
    if (data[0].data.lineConf &&
      data[0].data.lineConf.type == 'lineType1') {
      // lineType1 legend 绘制
      // lineType1 的类型 legend的坐标以线的结束点为参照

      let LegendG = this.centerG.append('g')
      .attr('class', 'LegendBox')
      .attr('transform', () => {
        if (this.circleOrigin.length == 0) {
          return 'translate(0,0)'
        }     
        return 'translate(' + ofx +','+ ofy + ')'
      })
      data.map((item, index) => {
        if (item.data.name) {
          LegendG.append('rect')
            .attr('rx', '3')
            .attr('ry', '3')
            .attr('width', 15)
            .attr('height', 15)
            .attr('x', 0)
            .attr('y', () => {
              return 35 * index
            })
            .attr('fill', () => {
              return this.color[index]
            })
        }
        LegendG.append('text')
          .attr('transform', ()=>{
            return 'translate(25, '+(index*35)+')'
          })
          .html(()=>{
            return '<tspan fill="#fff" y="11">'+ item.data.name +' '+ item.data.ratio+'</tspan>'
          })
          .attr('font-size', 14)
      })
    }
  }
}
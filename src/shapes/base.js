/**
 * @authors hgcoder (you@example.org)
 * @version $Id$
 * 图形基类
 */
import _ut from '../utils'
import theme from '../default'
export default class Base {
  defaultConf () {
    return {
      width: '',
      height: '',
      container: ''
    }
  }
  constructor (conf) {
    this.conf = _ut.assign(this.defaultConf(), conf);
    this.dom = document.getElementById(this.conf.container);
    // 支持传入容器的宽高
    this.conf.width = this.conf.width ? this.conf.width : this.dom.clientWidth;
    this.conf.height = this.conf.height ? this.conf.height : this.dom.clientHeight;
    this.theme = theme;
    this.created();
  }
  created () {
    // 画布位置
    let _this = this,
      dom = d3.select('#'+this.conf.container);
      dom.html(''); // 清空画布
    // if (document.getElementById(this.conf.container).innerHTML){
    //   d3.select('svg').selectAll('g').remove();
    //   this.svg = d3.select('svg');
    //   return
    // }
    // 主画布
    this.svg = dom
      .append('svg')
      .attr('width', this.conf.width)
      .attr('height', this.conf.height)
    // 新增地图模块包裹G元素 用在全图缩放
    this.wrapperG = this.svg.append('g')
      .attr('id', 'wrapperG')

  }
}

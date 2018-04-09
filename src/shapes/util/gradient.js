/**
 *
 * @authors hgcoder
 * 生成线性和放射性渐变
 * 需要参数：
 * defs, 渐变id
 * 可选：
 * opc-透明度，渐变类型
 * 默认线性渐变
 */
export default class gradient {
	constructor(props) {
		this.defs = props.defs
		this.graType = props.graType
		this.id = props.id
		this.gra = this.defs.append(this.graType)
		this.opc = props.opacity || '.8'
    this.colorRange = props.colorRange
    this.init()
	}
	init() {
		if (this.graType == 'radialGradient') {
			this.gra
				.attr('id', this.id)
				.attr('cx', '50%')
				.attr('cy', '50%')
				.attr('r', '50%')
				.attr('fx', '50%')
				.attr('fy', '50%')
		} else {
			this.gra
				.attr('id', this.id)
				.attr('x1', '0%')
				.attr('x2', '100%')
				.attr('y1', '0%')
				.attr('y2', '0%')
		}
		this.gra.append('stop')
			.attr('offset', '0%')
			.attr('style', 'stop-color:'+this.colorRange[0])
		this.gra.append('stop')
			.attr('offset', '100%')
			.attr('style', 'stop-color:'+this.colorRange[1])
	}
}

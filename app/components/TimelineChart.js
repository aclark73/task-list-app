"use strict";

import {
  default as React,
  Component,
  PropTypes,
} from 'react';

import {
  Xaxis,
  Yaxis,
  Xgrid,
  Ygrid,
  Legend
} from 'react-d3-core';

import {
  Bar,
  Chart
} from 'react-d3-shape';

import CommonProps from './commonProps';


class Bar extends Component {
  constructor (props) {
    super(props);
  }

  static defaultProps = {
    onMouseOver: (d) => {},
    onMouseOut: (d) => {},
    barClassName: 'react-d3-basic__bar'
  }

  triggerOver(data , e) {
    this.props.onMouseOver(e, data)
  }

  triggerOut(data, e) {
    this.props.onMouseOut(e, data)
  }

  _mkBar() {
    const {
      height,
      width,
      margins,
      barClassName,
      xScaleSet,
      yScaleSet
    } = this.props;

    const that = this
    var dataset = series(this.props)[0];
    var domain = yScaleSet.domain();
    var zeroBase;

    if (domain[0] * domain[1] < 0) {
      zeroBase = yScaleSet(0);
    } else if (((domain[0] * domain[1]) >= 0) && (domain[0] >= 0)){
      zeroBase = yScaleSet.range()[0];
    } else if (((domain[0] * domain[1]) >= 0) && (domain[0] < 0)){
      zeroBase = yScaleSet.range()[1];
    }

    return (
      <g>
        {
          this.props.data.map((bar, i) => {
            return (
              <rect 
                className={`${barClassName} bar`}
                x={xScaleSet(bar.x) || xScaleSet(bar.x) === 0? xScaleSet(bar.x) : -10000}
                y={bar.y < 0 ? zeroBase: yScaleSet(bar.y)}
                width={xScaleSet.bandwidth()}
                height={bar.y < domain[0] ? 0: Math.abs(zeroBase - yScaleSet(bar.y))}
                fill={bar._style.color? bar._style.color: dataset.color}
                style={Object.assign({}, dataset.style, bar._style)}
                onMouseOut={that.triggerOut.bind(this, bar)}
                onMouseOver={that.triggerOver.bind(this, bar)}
                key={i}
                />
            )
          })
        }
      </g>
    );
  }

  render() {
    var bar = this._mkBar();

    return (
      <g>
        {bar}
      </g>
    );
  }
}

export default class TimelineChart extends Component {

  constructor(props) {
    super(props);
  }

  static defaultProps = {
    onMouseOver: () => {},
    onMouseOut: () => {},
    ...CommonProps
  }

  static propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    margins: PropTypes.object.isRequired,
    data: PropTypes.array.isRequired,
    chartSeries: PropTypes.array.isRequired
  }

  render() {

    const {
      width,
      height,
      margins,
      data,
      chartSeries,
      showXGrid,
      showYGrid,
      showLegend,
      categoricalColors
    } = this.props;

    var xgrid, ygrid;

    if(showXGrid) xgrid = <Xgrid/>
    if(showYGrid) ygrid = <Ygrid/>

    return (
      <div>
        {showLegend?
          <Legend
            {...this.props}
            width= {width}
            margins= {margins}
            chartSeries= {chartSeries}
            categoricalColors= {categoricalColors}
          />
          : null
        }
        <Chart
          {...this.props}
          width= {width}
          height= {height}
          data= {data}
          chartSeries= {chartSeries}
          >
          <Bar
            chartSeries= {chartSeries}
          />
          {xgrid}
          {ygrid}
          <Xaxis/>
          <Yaxis/>
          {this.props.children}
        </Chart>
      </div>
    )
  }
}
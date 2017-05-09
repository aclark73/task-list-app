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
  Chart,
  series
} from 'react-d3-shape';

import d3 from 'd3';
import D3Shape from 'd3-shape';

import CommonProps from './commonProps';

class Timeline extends Component {
  constructor (props) {
    super(props);
  }

  static defaultProps = {
    defaultSymbol: 'circle',
    defaultSymbolSize: 10,
    scatterClassName: 'react-d3-basic__scatter'
  }

  _mkScatter(dataset) {
    const {
      scatterClassName,
      defaultSymbol,
      defaultSymbolSize,
      brushSymbol,
      xScaleSet,
      yScaleSet
    } = this.props;

    // for building symbols in brush, set to circle and size to 4
    if(brushSymbol) {
      symbol = 'circle';
      symbolSize = 4
    }

    return (
      <g>
        {
          dataset.map((dot) => {
            var symbol = dot.symbol? dot.symbol: defaultSymbol;
            var symbolSize = dot.symbolSize? dot.symbolSize: defaultSymbolSize;

            return dot.data.map((d) => {
              // if (!yScaleSet(d.y)) { return null; }
              var symbolFunc = D3Shape.symbol()
                .size(symbolSize * symbolSize)
                .type(
                  () => {
                    console.log(symbol)

                    if(symbol === 'circle') {
                      return D3Shape.symbolCircle
                    }else if(symbol === 'cross') {
                      return D3Shape.symbolCross
                    }else if(symbol === 'diamond') {
                      return D3Shape.symbolDiamond
                    }else if(symbol === 'square') {
                      return D3Shape.symbolSquare
                    }else if(symbol === 'star') {
                      return D3Shape.symbolStar
                    }else if(symbol === 'triangle') {
                      return D3Shape.symbolTriangle
                    }else if(symbol === 'wye') {
                      return D3Shape.symbolWye
                    }else {
                      console.error('Symbol is not support ' + symbol + '.')
                    }
                  }
                )

              return (
                <path
                  className='react-d3-basic__scatter__path'
                  fill={d.color}
                  transform={"translate(" + xScaleSet(d.x) + "," + yScaleSet(d.y) + ")"}
                  d={symbolFunc()}
                  style={dot.style}
                  />
              )
            })
          })
        }
      </g>
    )
  }

  series() {
    var {
      data,
      chartSeries,
      x,
      y,
      categoricalColors
    } = this.props;
  
    categoricalColors = categoricalColors || d3.scale.category10();
    
    const seriesLookup = {};
    var chartSeriesData = chartSeries.map((f, i) => {
  
      // set a color if not set
      f.color = f.color || categoricalColors(i);
  
      // set name if not set
      f.name = f.name || f.field;
      
      f.data = [];
      seriesLookup[f.field] = f;
      
      return f;
    });
    
    data.forEach(d => {
      if(!d._style) d._style = {};
      
      const f = seriesLookup[d.series];
      
      f.data.push({
        y: y(d),
        x: x(d),
        color: f.color,
        name: f.name,
        field: f.field,
        _style: d._style
      });
    });
    
    return chartSeriesData;
  }
  
  render() {
    var d = this.series();
    var scatter = this._mkScatter(d);

    return (
      <g>
        {scatter}
      </g>
    )
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
          <Timeline
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
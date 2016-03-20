import React, { Component } from 'react'

class Row extends Component {
  render() {
    return (
      <li key={this.props.label}>{this.props.label}</li>
    );
  }
}

const ROWS = [
  {label: "Item 1"},
  {label: "Item 2"},
  {label: "Item 3"},
  {label: "Item 4"},
  {label: "Item 5"}
];

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rows: []
    };
  }
  update() {
    this.setState({rows: ROWS});
  }
  render() {
    const rows = [];
    this.state.rows.forEach(function(row) {
      rows.push(<Row label={row.label} />);
    });
    return(
      <div>
        <h1>Hello World 3</h1>
        <div><button type="button" onClick={this.update.bind(this)}>Update</button></div>
        <ul>{rows}</ul>
      </div>
    );
  }
}

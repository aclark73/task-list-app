import React, { Component } from 'react'

class Row extends Component {
  handleClick() {
    this.props.handleClick(this.props.label);
  }
  render() {
    const handleClick = this.handleClick.bind(this);
    return (
      <li>
        {this.props.label}
        <button type="button" onClick={handleClick} />
      </li>
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
  handleUpdate() {
    this.setState({rows: ROWS});
  }
  handleRowClick(row) {
    console.log("Clicked on row: " + row);
  }
  render() {
    const rows = [];
    const handleRowClick = this.handleRowClick.bind(this);
    this.state.rows.forEach(function(row) {
      rows.push(<Row key={row.label} label={row.label} handleClick={handleRowClick} />);
    });
    const handleUpdate = this.handleUpdate.bind(this);
    return(
      <div >
        <h1>Hello World 3</h1>
        <div><button type="button" onClick={handleUpdate}>Update</button></div>
        <ul>{rows}</ul>
      </div>
    );
  }
}

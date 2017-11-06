import React, { Component } from 'react';

export default class Search extends Component {
    updateSearch(event) {
        console.log("search", event.target.value);
        // this.props.context.actions.search(event.target.value);
        this.props.setSearch(event.target.value);
    }

    clearSearch() {
        this.props.setSearch("");
    }

    handleKeyPress(event) {
        // console.log("Event key is " + event.key);
        if (event.key == 'Escape') {
            this.clearSearch();
        }
    }

    render() {
        const updateSearch = this.updateSearch.bind(this);
        const clearSearch = this.clearSearch.bind(this);
        const handleKeyPress = this.handleKeyPress.bind(this);
        return (
            <div className="search">
                <input type="text" value={this.props.search} placeholder="Search" onChange={updateSearch} onKeyUp={handleKeyPress} />
                <span onClick={clearSearch} className="clear-btn"><span className="fa fa-times-circle"></span></span>
            </div>
        );
    };
};

const React = require('react');
const CommitRangeView = require('./commit_range_view');
const ItemList = require('./item_list');

class CommitRangeViewFull extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: undefined,
    };
  }
  
  onDiagramReady(data) {
    this.setState({ items: [].concat(data.items) });
  }

  render() {
    console.log("redrawing");
    console.log(this.state);
    return(
      <div className="minu-container">
        <div className="box-1">
          <ItemList items={this.state.items} />
        </div>
        <div className="box-2">
          <CommitRangeView onReady={this.onDiagramReady.bind(this)} {...this.props} />
        </div>
      </div>
    );
  }
}

module.exports = CommitRangeViewFull;

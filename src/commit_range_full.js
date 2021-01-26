const React = require('react');
const CommitRangeView = require('./commit_range_view');
const ItemList = require('./item_list');

function loadData(url) {
  return fetch(url)
          .then((result) => result.json());
}

class CommitRangeViewFull extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: undefined,
      data: {
        commits: [],
      },
    };
  }
  
  onDiagramReady(data) {
    this.setState({ items: [].concat(data.items) });
  }

  componentDidMount() {
    loadData(this.props.url)
      .then(data => {
        data.commits = data.commits.concat(data.commits).concat(data.commits).concat(data.commits);
        /*data.commits = data.commits.concat(data.commits).concat(data.commits).concat(data.commits);
        data.commits = data.commits.concat(data.commits).concat(data.commits).concat(data.commits);
        data.commits = data.commits.concat(data.commits).concat(data.commits).concat(data.commits);
        data.commits = data.commits.concat(data.commits).concat(data.commits).concat(data.commits);
        data.commits = data.commits.concat(data.commits).concat(data.commits).concat(data.commits);
        data.commits = data.commits.concat(data.commits).concat(data.commits).concat(data.commits);
        data.commits = data.commits.concat(data.commits).concat(data.commits).concat(data.commits);
        data.commits = data.commits.concat(data.commits).concat(data.commits).concat(data.commits);*/
        console.log(data);
        this.setState({ ...this.state, data: data });
      })
      .catch(error => console.log(error));
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
          <CommitRangeView onReady={this.onDiagramReady.bind(this)} {...this.props} data={this.state.data} />
        </div>
      </div>
    );
  }
}

module.exports = CommitRangeViewFull;

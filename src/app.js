const uiConfig = require('./ui_config');
const CommitRangeView = require('./commit_range_view');
const React = require('react');
const ReactDOM = require('react-dom');
const diagramStyle = require('./css/diagram.css');

class App extends React.Component {
  render() {
    return(
      <div id="container">
        <div id="flexbox">
          <div id="leftMenu">
          </div>
          <div id="rightMenu">
            <CommitRangeView url={uiConfig.commitRangeView.apiUrl} />
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App/>, document.getElementById('root'));

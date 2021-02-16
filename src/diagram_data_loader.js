const { loadData, buildGetHttpRequestUrl } = require('./utils');

class DiagramDataLoader {
  load(url, params) {
    const requestUrl = buildGetHttpRequestUrl(url, params);
    return loadData(requestUrl);
  }
}

module.exports = DiagramDataLoader;

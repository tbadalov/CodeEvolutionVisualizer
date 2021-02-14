const { loadData, buildGetHttpRequestUrl } = require('./utils');

export class DiagramDataLoader {
  load(url, params) {
    const requestUrl = buildGetHttpRequestUrl(url, params);
    return loadData(requestUrl);
  }
}

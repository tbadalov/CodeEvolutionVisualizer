export function loadData(url) {
  return fetch(url)
          .then((result) => result.json());
}

export function buildGetHttpRequestUrl(url, params = {}) {
  const keyValues = [];
  for (let paramName in params) {
    const paramValue = params[paramName];
    if (paramValue !== undefined) {
      keyValues.push(`${paramName}=${paramValue}`);
    }
  }
  return `${url}?${keyValues.join('&')}`;
}

export function groupBy(array, key) {
  return array.reduce(
    (result, element) => {
      (result[element[key]] = result[element[key]] || []).push(element);
      return result;
    },
    {}
  );
};

export function extractUniqueValues(array) {
  const cache = {};
  for (let element of array) {
    cache[element] = true;
  }
  return Object.keys(cache);
}

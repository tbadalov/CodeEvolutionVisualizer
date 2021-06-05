# CodeEvolutionVisualizer

This tool visualizes source code evolution based on the repository data produced by [GraphifyEvolution](https://github.com/kristiinara/GraphifyEvolution) tool.
## Example app

[This](https://code-evolution-visualizer.herokuapp.com) is an example app that is deployed to Heroku.

## Usage

### Commit range view

![ascii-clock](https://i.ibb.co/7Ksnrn3/commit-range-view.png)


### Class overview view
To open the view, hold your mouse and select the range of commits in "Commit range" view Commit range view

![ascii-clock](https://i.ibb.co/gwj85pN/class-overview-view.png)


### Call volume view
To open the view, click on any commit hash in "Commit range" view Commit range view

![ascii-clock](https://i.ibb.co/Qb6Y3N6/call-volume-view.png)


## Running locally

> **Make sure you are running Neo4J database with the dump generated from GraphifyEvolution**

### Configure Neo4J params

Open the "neo4jconfig.js" file and fill in details like user, password and database uri, e.g.:
```javascript
module.exports = {
  user: 'neo4j',
  password: process.env.NEO4J_PASS || 'neo4j',
  uri: 'bolt://localhost:7687'
}
```

### Run the application

Go to the folder with the project in your console. You have to run UI and Backend separately.First, run UI:
```bash
npm run dev:start-ui
```

Run the backend in another console:
```bash
npm run dev:start-server
```

Wait until both components are ready (usually takes less than a minute). Navigate to http://localhost:8080/ in your browser.

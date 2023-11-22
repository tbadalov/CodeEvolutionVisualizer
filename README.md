# CodeEvolutionVisualizer
https://github.com/tbadalov/CodeEvolutionVisualizer/edit/main/README.md
This tool visualizes source code evolution based on the repository data produced by [GraphifyEvolution](https://github.com/kristiinara/GraphifyEvolution) tool.
## Example app

[This](https://code-evolution-visualizer.herokuapp.com) is an example app that is deployed to Heroku.

## Usage

### Commit range view

![ascii-clock](https://i.ibb.co/7Ksnrn3/commit-range-view.png)


### Class overview view
To open the view, hold your mouse and select the range of commits in "Commit range" view.

![ascii-clock](https://i.ibb.co/gwj85pN/class-overview-view.png)


### Call volume view
To open the view, click on any commit hash in "Commit range" view.

![ascii-clock](https://i.ibb.co/Qb6Y3N6/call-volume-view.png)


## Running locally

To run the project locally, it is as simple as running a docker compose with the following command inside of the root directory of this project:
```shell
docker compose up -d
```

Wait until both components are ready (usually takes less than a minute). Navigate to http://localhost:3000/ in your browser.

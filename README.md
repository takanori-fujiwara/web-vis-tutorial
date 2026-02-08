## Tutorial: How to Build an Interactive Visualization Web Application

This tutorial explains how to build a full-stack web application with a special focus on **interactive visualization**. This README documentation is made using Claude Code.

You will learn:

- **Frontend/UI**: HTML, CSS, JavaScript (with [D3.js](https://d3js.org/))
- **Backend/Data Processing**: Python (with [NetworkX](https://networkx.org/), [Pyodide](https://pyodide.org/), [WebSockets](https://websockets.readthedocs.io/))

Each numbered directory (`1_html`, `2_css`, ..., `8_use_python_via_websocket`) represents a progressive step. By working through them in order, you will go from a plain HTML page to a fully interactive, linked visualization application with a Python backend.

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- [Python 3](https://www.python.org/) (for running a local HTTP server, and for Steps 7-8)
- A text editor or IDE of your choice

### Repository Structure

```
web-vis-tutorial/
├── 1_html/                          # Step 1: Basic HTML
│   └── index.html
├── 2_css/                           # Step 2: CSS Styling
│   ├── index.html
│   └── style/style.css
├── 3_d3/                            # Step 3: D3.js Scatterplot
│   ├── index.html
│   ├── script/main.js
│   ├── script/scatterplot.js
│   └── style/style.css
├── 4_load_data/                     # Step 4: Loading External Data
│   ├── index.html
│   ├── data/mtcars.csv
│   ├── script/main.js
│   ├── script/scatterplot.js
│   └── style/style.css
├── 5_lasso_selection/               # Step 5: Lasso Selection
│   ├── index.html
│   ├── data/mtcars.csv
│   ├── script/main.js
│   ├── script/scatterplot.js
│   ├── script/lasso.js
│   └── style/style.css
├── 6_linking/                       # Step 6: Linked Views
│   ├── index.html
│   ├── data/mtcars.csv
│   ├── script/main.js
│   ├── script/scatterplot.js
│   ├── script/lasso.js
│   └── style/style.css
├── 7_use_python_via_pyodide/        # Step 7: Python in the Browser (Pyodide)
│   ├── index.html
│   ├── data/mtcars.csv
│   ├── script/main.js
│   ├── script/scatterplot.js
│   ├── script/lasso.js
│   └── style/style.css
├── 8_use_python_via_websocket/      # Step 8: Python Backend (WebSocket)
│   ├── index.html
│   ├── backend/ws_server.py
│   ├── backend/requirements.txt
│   ├── data/mtcars.csv
│   ├── script/main.js
│   ├── script/scatterplot.js
│   ├── script/lasso.js
│   └── style/style.css
├── LICENSE
└── README.md
```

---

## Step 1: Basic HTML (`1_html`)

**Goal**: Learn how to structure a web page with HTML `<div>` elements as containers for future visualizations.

**What you will learn**:

- The basic structure of an HTML document (`<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`)
- Using `<div>` elements to define view containers (View A, View B, View C, View D)
- Nesting `<div>` elements to create hierarchical layouts

**Key code** (`1_html/index.html`):

```html
<body>
  <div>This place will be allocated to View A.</div>
  <div>This place will be allocated to View B.</div>
  <div>
    This place will be allocated to Views C and D.
    <div>View C</div>
    <div>View D</div>
  </div>
</body>
```

**How to run**: Open `1_html/index.html` directly in your browser. You will see only plain text.

---

## Step 2: CSS Styling (`2_css`)

**Goal**: Style the HTML containers using CSS to create a multi-view layout.

**What you will learn**:

- Linking an external CSS file with `<link rel='stylesheet' href='style/style.css'>`
- Assigning `id` and `class` attributes to HTML elements for CSS targeting
- Using CSS properties for layout: `float`, `display: flex`, `position`, `width`, `height`, `margin`, `border`
- Creating a dashboard-like layout with side-by-side views

**Key concepts**:

- `#view_a`, `#view_b`, `#view_cd` are styled with fixed widths and heights using `vh` (viewport height) units
- `#view_c` and `#view_d` are nested inside `#view_cd`, stacked vertically
- `.view_title` class provides a label badge positioned at the top-right corner of each view

**How to run**: Open `2_css/index.html` directly in your browser. You will see styled, empty containers laid out as a dashboard.

---

## Step 3: Drawing a Scatterplot with D3.js (`3_d3`)

**Goal**: Create an SVG scatterplot using [D3.js](https://d3js.org/) with hardcoded data.

**What you will learn**:

- Importing D3.js as an ES module: `import * as d3 from 'https://cdn.skypack.dev/d3@7'`
- Loading JavaScript modules in HTML: `<script src='script/main.js' type='module'></script>`
- Building a reusable `scatterplot()` function that:
  - Creates an SVG element with `d3.create('svg')`
  - Maps data to x/y positions using `d3.scaleLinear`
  - Draws axes with `d3.axisBottom` and `d3.axisLeft`
  - Renders data points as `<circle>` elements using D3's data join (`.data().join()`)
- Appending the generated SVG to a specific container: `d3.select('#view_b').append(() => chart)`

**Key code** (`3_d3/script/main.js`):

```js
const chart = scatterplot(
  [
    [0, 0],
    [0, 1],
    [0.5, 0.5],
    [1, 0],
  ],
  {
    c: ["#aa0000", "#00aa00", "#0000aa", "#880088"],
  },
);

d3.select("#view_b").append(() => chart);
```

**How to run**:

```bash
cd 3_d3
python3 -m http.server
# Open http://localhost:8000/ in your browser
```

A simple scatterplot with 4 colored points will appear in View B.

> **Note**: An HTTP server is required from this step onward because browsers restrict loading JavaScript modules from local files (`file://` protocol).

---

## Step 4: Loading External Data (`4_load_data`)

**Goal**: Load real data from a CSV file and visualize it.

**What you will learn**:

- Loading CSV data asynchronously with `d3.csv()` and `d3.autoType` for automatic type inference
- Using accessor functions to map data fields to visual properties:
  ```js
  x: d => d.mpg,
  y: d => d.hp
  ```
- The [mtcars dataset](https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/mtcars.html) (Motor Trend Car Road Tests) is used as example data

**Key code** (`4_load_data/script/main.js`):

```js
const cars = await d3.csv("./data/mtcars.csv", d3.autoType);

const chart = scatterplot(cars, {
  x: (d) => d.mpg,
  y: (d) => d.hp,
  c: "#aa0000",
});
```

**How to run**:

```bash
cd 4_load_data
python3 -m http.server
# Open http://localhost:8000/ in your browser
```

A scatterplot showing mpg vs. hp from the mtcars dataset will appear.

---

## Step 5: Lasso Selection (`5_lasso_selection`)

**Goal**: Add interactive lasso selection to the scatterplot.

**What you will learn**:

- Implementing a lasso selection tool (`lasso.js`) that:
  - Overlays an HTML Canvas on top of the SVG for drawing the lasso stroke
  - Uses `d3.drag()` to handle mouse drag events
  - Determines which points fall inside the lasso polygon using a point-in-polygon algorithm
- Connecting the lasso interaction to the scatterplot's visual update:
  - Selected points keep the default color; unselected points turn gray
- The `scatterplot` function now exposes an `update()` method to change point colors dynamically

**Key code** (`5_lasso_selection/script/main.js`):

```js
const lasso = lassoSelection();

lasso.on("end", () => {
  const selected = lasso.selected();
  if (Math.max(...selected) === 0) {
    chart.update(defaultColor);
  } else {
    const pointColors = selected.map((s) =>
      s ? defaultColor : unselectedColor,
    );
    chart.update(pointColors);
  }
});

d3.select(chart).call(
  lasso(chart, d3.select(chart).selectAll("circle").nodes()),
);
```

**How to run**:

```bash
cd 5_lasso_selection
python3 -m http.server
# Open http://localhost:8000/ in your browser
```

The scatterplot now supports lasso selection: click and drag to draw a freeform selection region.

---

## Step 6: Linked Views (`6_linking`)

**Goal**: Link multiple visualizations so that interaction in one view updates another.

**What you will learn**:

- Creating two separate visualizations: a **scatterplot** (View B) and a **node-link diagram** (View C)
- Reusing the `scatterplot()` function for both plots (with `links` parameter for drawing edges in the node-link diagram)
- Linking the lasso selection across views: selecting points in one view highlights corresponding items in the other
- Adjusting chart dimensions dynamically using `getBoundingClientRect()`

**Key code** (`6_linking/script/main.js`):

```js
// Lasso selection updates both views simultaneously
lasso.on("end", () => {
  const selected = lasso.selected();
  if (Math.max(...selected) === 0) {
    scatter.update(defaultColor);
    network.update(defaultColor);
  } else {
    const pointColors = selected.map((s) =>
      s ? defaultColor : unselectedColor,
    );
    scatter.update(pointColors);
    network.update(pointColors);
  }
});

// Lasso is applied to both the scatterplot and the node-link diagram
d3.select(scatter).call(
  lasso(scatter, d3.select(scatter).selectAll("circle").nodes()),
);
d3.select(network).call(
  lasso(network, d3.select(network).selectAll("circle").nodes()),
);
```

**How to run**:

```bash
cd 6_linking
python3 -m http.server
# Open http://localhost:8000/ in your browser
```

A scatterplot and a node-link diagram will appear. Lasso selection in either view will highlight the corresponding points in both views. Note: node positions are random in this example.

---

## Step 7: Using Python in the Browser via Pyodide (`7_use_python_via_pyodide`)

**Goal**: Run Python code directly in the browser using [Pyodide](https://pyodide.org/) (Python compiled to WebAssembly).

**What you will learn**:

- Loading Pyodide via a `<script>` tag in the HTML header:
  ```html
  <script src="https://cdn.jsdelivr.net/pyodide/v0.21.1/full/pyodide.js"></script>
  ```
- Initializing Pyodide and loading Python packages (`networkx`, `numpy`):
  ```js
  const pyodide = await loadPyodide();
  await pyodide.loadPackage("networkx");
  await pyodide.loadPackage("numpy");
  ```
- Passing JavaScript data to Python with `pyodide.registerJsModule()`
- Running Python code from JavaScript with `pyodide.runPython()` to compute a spring layout using NetworkX
- Retrieving Python results back in JavaScript with `pyodide.globals.get().toJs()`

**Key code** (`7_use_python_via_pyodide/script/main.js`):

```js
pyodide.registerJsModule("vars_from_js", { nodes, links: randomLinks });

pyodide.runPython(`
  import numpy as np
  import networkx as nx
  from vars_from_js import nodes, links

  G = nx.Graph()
  G.add_nodes_from(nodes)
  G.add_edges_from(links)
  positions = nx.spring_layout(G)
  positions = np.array(list(positions.values()))
`);

const positions = pyodide.globals.get("positions").toJs();
```

**How to run**:

```bash
cd 7_use_python_via_pyodide
python3 -m http.server
# Open http://localhost:8000/ in your browser
```

The result is similar to Step 6, but the node-link diagram now uses NetworkX's spring layout for better node positioning. Initial loading takes a few seconds due to Pyodide and package downloads.

---

## Step 8: Using Python Backend via WebSocket (`8_use_python_via_websocket`)

**Goal**: Offload Python computation to a backend server communicating via WebSocket.

**What you will learn**:

- Setting up a Python WebSocket server (`ws_server.py`) using the `websockets` library
- Defining a message protocol with action types to route different request/response pairs
- Using `pandas` to read CSV data on the server side and send it to the frontend as JSON
- Using `networkx` on the server side to compute graph layouts
- Connecting the frontend to the WebSocket server:
  ```js
  const ws = new WebSocket("ws://localhost:9000");
  ```
- Handling asynchronous message exchange with `ws.onopen`, `ws.send()`, and `ws.onmessage`

**How to run**:

1. **Start the WebSocket server** (Terminal 1):

   ```bash
   cd 8_use_python_via_websocket/backend
   python3 -m venv .venv
   . .venv/bin/activate
   pip3 install -r requirements.txt
   python3 ws_server.py
   ```

2. **Start the HTTP server** (Terminal 2):

   ```bash
   cd 8_use_python_via_websocket
   python3 -m http.server
   ```

3. Open http://localhost:8000/ in your browser.

The result is the same as Step 7, but with faster loading since Python runs natively on the server instead of in the browser via WebAssembly.

---

## Summary

| Step | Directory                    | Key Topics                                                    |
| ---- | ---------------------------- | ------------------------------------------------------------- |
| 1    | `1_html`                     | HTML structure, `<div>` containers                            |
| 2    | `2_css`                      | CSS layout, styling, flexbox                                  |
| 3    | `3_d3`                       | D3.js, SVG, scatterplot, scales, axes                         |
| 4    | `4_load_data`                | CSV loading with D3, data accessors                           |
| 5    | `5_lasso_selection`          | Interactive lasso selection, Canvas overlay, point-in-polygon |
| 6    | `6_linking`                  | Linked/coordinated views, shared interaction                  |
| 7    | `7_use_python_via_pyodide`   | Pyodide (Python in browser), NetworkX spring layout           |
| 8    | `8_use_python_via_websocket` | WebSocket server, Python backend, client-server architecture  |

## License

BSD 3-Clause License. See [LICENSE](LICENSE) for details.

const doc = document;


const GRID_ROWS = 25;
const GRID_COLS = 50;
const CELL_TYPES = {
    WALL: 1,
    PATH: 0,
    START: 2,
    END: 3,
    VISITED: 4,
    SHORTEST_PATH: 5
};
const CELL_COLORS = {
    [CELL_TYPES.WALL]: 'wall',
    [CELL_TYPES.PATH]: 'path',
    [CELL_TYPES.START]: 'start',
    [CELL_TYPES.END]: 'end',
    [CELL_TYPES.VISITED]: 'visited',
    [CELL_TYPES.SHORTEST_PATH]: 'shortest-path'
};

let grid = [];
let startPoint = null;
let endPoint = null;
let isDrawing = false;
let animationDelay = 10; 

const mazeGridElement = doc.getElementById('maze-grid');
const bfsBtn = doc.getElementById('bfs-btn');
const dfsBtn = doc.getElementById('dfs-btn');
const dijkstraBtn = doc.getElementById('dijkstra-btn');
const randomMazeBtn = doc.getElementById('random-maze-btn');
const clearPathBtn = doc.getElementById('clear-path-btn');
const clearWallsBtn = doc.getElementById('clear-walls-btn');
const timeDisplayElement = doc.getElementById('time-display');

function initializeGrid() {
    startPoint = null;
    endPoint = null;
    grid = [];
    if (mazeGridElement) {
      mazeGridElement.innerHTML = '';
      mazeGridElement.style.gridTemplateColumns = `repeat(${GRID_COLS}, 1fr)`;
      
      for (let row = 0; row < GRID_ROWS; row++) {
          grid[row] = [];
          for (let col = 0; col < GRID_COLS; col++) {
              grid[row][col] = CELL_TYPES.PATH;
              const cell = doc.createElement('div');
              cell.classList.add('grid-cell', CELL_COLORS[CELL_TYPES.PATH]);
              cell.dataset.row = row;
              cell.dataset.col = col;
              mazeGridElement.appendChild(cell);
          }
      }
    }
}

function drawMaze() {
    if (!mazeGridElement) return;
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            const cell = mazeGridElement.children[row * GRID_COLS + col];
            cell.className = `grid-cell ${CELL_COLORS[grid[row][col]]}`;
            cell.textContent = '';
            if (grid[row][col] === CELL_TYPES.START) {
                cell.textContent = 'S';
            } else if (grid[row][col] === CELL_TYPES.END) {
                cell.textContent = 'E';
            }
        }
    }
}

function handleGridMouseDown(e) {
    isDrawing = true;
    const target = e.target;
    const row = parseInt(target.dataset.row);
    const col = parseInt(target.dataset.col);
    if (grid[row][col] === CELL_TYPES.PATH) {
        if (!startPoint) {
            startPoint = {row, col};
            grid[row][col] = CELL_TYPES.START;
        } else if (!endPoint) {
            endPoint = {row, col};
            grid[row][col] = CELL_TYPES.END;
        } else {
            grid[row][col] = CELL_TYPES.WALL;
        }
    } else if (grid[row][col] === CELL_TYPES.WALL) {
        grid[row][col] = CELL_TYPES.PATH;
    }
    drawMaze();
}

function handleGridMouseUp() {
    isDrawing = false;
}

function handleGridMouseMove(e) {
    if (!isDrawing) return;
    const target = e.target;
    const row = parseInt(target.dataset.row);
    const col = parseInt(target.dataset.col);
    if (startPoint && endPoint && grid[row][col] === CELL_TYPES.PATH) {
        grid[row][col] = CELL_TYPES.WALL;
        drawMaze();
    }
}

function handleClearPath() {
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            if (grid[row][col] === CELL_TYPES.VISITED || grid[row][col] === CELL_TYPES.SHORTEST_PATH) {
                grid[row][col] = CELL_TYPES.PATH;
            }
        }
    }
    drawMaze();
}

function handleClearWalls() {
    initializeGrid();
    drawMaze();
}


async function solveMaze(algorithm) {
    if (!startPoint || !endPoint) {
        alert('Please set both start (S) and end (E) points first.');
        return;
    }
    handleClearPath();
    timeDisplayElement.innerHTML = `Solving with ${algorithm.toUpperCase()}...`;

    const requestData = {
        grid: grid,
        start: [startPoint.row, startPoint.col],
        end: [endPoint.row, endPoint.col],
        algorithm: algorithm
    };

    const startTime = performance.now();

    try {
        const response = await fetch('/solve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        const data = await response.json();

        if (data.path && data.path.length > 0) {
            await animate(data.visited_cells, data.path);
            const endTime = performance.now(); // Stop timer after animation
            const totalTime = ((endTime - startTime) / 1000).toFixed(3);
            const pathLength = data.path.length;
            timeDisplayElement.innerHTML = `Path Found! Length: <strong class="text-blue-600">${pathLength}</strong> cells, Time: <strong class="text-blue-600">${totalTime}s</strong>`;
        } else {
            await animate(data.visited_cells, []);
            const endTime = performance.now(); // Stop timer after animation
            const totalTime = ((endTime - startTime) / 1000).toFixed(3);
            timeDisplayElement.innerHTML = `No Path Found! Length: <strong class="text-red-500">0</strong> cells, Time: <strong class="text-red-500">${totalTime}s</strong>`;
            alert('No path found!');
        }

    } catch (error) {
        console.error('Error solving maze:', error);
        alert('An error occurred while solving the maze.');
    }
}

async function animate(visitedCells, path) {
    for (const [row, col] of visitedCells) {
        if (grid[row][col] !== CELL_TYPES.START && grid[row][col] !== CELL_TYPES.END) {
            const cell = mazeGridElement.children[row * GRID_COLS + col];
            cell.className = `grid-cell ${CELL_COLORS[CELL_TYPES.VISITED]} visited-animation`;
            await new Promise(resolve => setTimeout(resolve, animationDelay));
        }
    }

    if (path.length > 0) {
        for (const [row, col] of path) {
            if (grid[row][col] !== CELL_TYPES.START && grid[row][col] !== CELL_TYPES.END) {
                const cell = mazeGridElement.children[row * GRID_COLS + col];
                cell.className = `grid-cell ${CELL_COLORS[CELL_TYPES.SHORTEST_PATH]} path-animation`;
                await new Promise(resolve => setTimeout(resolve, animationDelay));
            }
        }
    }
}

// --- Event Listeners ---
doc.addEventListener('DOMContentLoaded', () => {
    // Only set up event listeners after the DOM is fully loaded.
    if (mazeGridElement) {
        mazeGridElement.addEventListener('mousedown', handleGridMouseDown);
        mazeGridElement.addEventListener('mouseup', handleGridMouseUp);
        mazeGridElement.addEventListener('mousemove', handleGridMouseMove);
        mazeGridElement.addEventListener('mouseleave', handleGridMouseUp);
    }
    if (bfsBtn) bfsBtn.addEventListener('click', () => solveMaze('bfs'));
    if (dfsBtn) dfsBtn.addEventListener('click', () => solveMaze('dfs'));
    if (dijkstraBtn) dijkstraBtn.addEventListener('click', () => solveMaze('dijkstra'));
    if (randomMazeBtn) randomMazeBtn.addEventListener('click', () => {
        initializeGrid();
        startPoint = {row: Math.floor(Math.random() * GRID_ROWS), col: Math.floor(Math.random() * GRID_COLS)};
        endPoint = {row: Math.floor(Math.random() * GRID_ROWS), col: Math.floor(Math.random() * GRID_COLS)};
        grid[startPoint.row][startPoint.col] = CELL_TYPES.START;
        grid[endPoint.row][endPoint.col] = CELL_TYPES.END;
        for(let i = 0; i < GRID_ROWS * GRID_COLS * 0.4; i++) {
            let row = Math.floor(Math.random() * GRID_ROWS);
            let col = Math.floor(Math.random() * GRID_COLS);
            if (grid[row][col] === CELL_TYPES.PATH) {
                grid[row][col] = CELL_TYPES.WALL;
            }
        }
        drawMaze();
        timeDisplayElement.innerHTML = '';
    });
    if (clearPathBtn) clearPathBtn.addEventListener('click', () => {
        handleClearPath();
        timeDisplayElement.innerHTML = '';
    });
    if (clearWallsBtn) clearWallsBtn.addEventListener('click', () => {
        handleClearWalls();
        timeDisplayElement.innerHTML = '';
    });

    initializeGrid();
    drawMaze();
});
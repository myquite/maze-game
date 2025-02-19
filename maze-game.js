const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const cols = 15, rows = 15;
let cellSize = 40; // Fixed cell size for now
canvas.width = cols * cellSize;
canvas.height = rows * cellSize;

let grid = [];
let stack = [];
let current;
let player = { x: 0, y: 0 };
const goal = { x: cols - 1, y: rows - 1 };
let startTime, timer;
let gameActive = false;
let mazeCompleted = false;
const timerDisplay = document.getElementById('timer');
const newMazeBtn = document.getElementById('newMazeBtn');

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.walls = { top: true, right: true, bottom: true, left: true };
        this.visited = false;
    }
    draw() {
        const x = this.x * cellSize;
        const y = this.y * cellSize;
        ctx.strokeStyle = "white";
        if (this.walls.top) ctx.strokeRect(x, y, cellSize, 1);
        if (this.walls.right) ctx.strokeRect(x + cellSize, y, 1, cellSize);
        if (this.walls.bottom) ctx.strokeRect(x, y + cellSize, cellSize, 1);
        if (this.walls.left) ctx.strokeRect(x, y, 1, cellSize);
    }
}

function initializeGame() {
    // Initialize grid
    grid = [];
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            grid.push(new Cell(x, y));
        }
    }
    
    // Initialize maze generation
    stack = [];
    current = grid[0];
    current.visited = true;
    
    // Reset game state
    player = { x: 0, y: 0 };
    startTime = null;
    gameActive = false;
    mazeCompleted = false;
    timerDisplay.textContent = 'Time: 0.0s';
}

function removeWalls(a, b) {
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    if (dx === 1) { a.walls.left = false; b.walls.right = false; }
    else if (dx === -1) { a.walls.right = false; b.walls.left = false; }
    if (dy === 1) { a.walls.top = false; b.walls.bottom = false; }
    else if (dy === -1) { a.walls.bottom = false; b.walls.top = false; }
}

function getNeighbors(cell) {
    let neighbors = [];
    let directions = [
        { x: 0, y: -1 }, { x: 1, y: 0 }, 
        { x: 0, y: 1 }, { x: -1, y: 0 }
    ];
    directions.forEach(({ x, y }) => {
        let nx = cell.x + x;
        let ny = cell.y + y;
        let neighbor = grid.find(c => c.x === nx && c.y === ny && !c.visited);
        if (neighbor) neighbors.push(neighbor);
    });
    return neighbors;
}

function generateMaze() {
    let next = getNeighbors(current).sort(() => Math.random() - 0.5)[0];
    if (next) {
        next.visited = true;
        stack.push(current);
        removeWalls(current, next);
        current = next;
    } else if (stack.length > 0) {
        current = stack.pop();
    }
}

function updateTimer() {
    if (gameActive && startTime) {
        const elapsed = (Date.now() - startTime) / 1000;
        timerDisplay.textContent = `Time: ${elapsed.toFixed(1)}s`;
    }
}

function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    grid.forEach(cell => cell.draw());
    
    ctx.fillStyle = "blue";
    ctx.fillRect(player.x * cellSize + 5, player.y * cellSize + 5, cellSize - 10, cellSize - 10);
    
    ctx.fillStyle = "red";
    ctx.fillRect(goal.x * cellSize + 10, goal.y * cellSize + 10, cellSize - 20, cellSize - 20);
}

function movePlayer(dx, dy) {
    // Don't allow any movement if the maze is completed
    if (mazeCompleted) {
        return;
    }
    
    let nextX = player.x + dx;
    let nextY = player.y + dy;
    let currentCell = grid.find(c => c.x === player.x && c.y === player.y);
    let nextCell = grid.find(c => c.x === nextX && c.y === nextY);
    
    if (!nextCell) return;
    
    if ((dx === -1 && !currentCell.walls.left) ||
        (dx === 1 && !currentCell.walls.right) ||
        (dy === -1 && !currentCell.walls.top) ||
        (dy === 1 && !currentCell.walls.bottom)) {
        
        // Start timer on first move
        if (!startTime) {
            startTime = Date.now();
            gameActive = true;
        }
        
        player.x = nextX;
        player.y = nextY;
        
        // Check for maze completion
        if (player.x === goal.x && player.y === goal.y) {
            gameActive = false;
            mazeCompleted = true;
            const finalTime = ((Date.now() - startTime) / 1000).toFixed(1);
            timerDisplay.textContent = `Time: ${finalTime}s`;
        }
    }
}

function gameLoop() {
    generateMaze();
    draw();
    if (stack.length > 0) {
        requestAnimationFrame(gameLoop);
    }
}

function animate() {
    draw();
    if (gameActive) {
        updateTimer();
    }
    requestAnimationFrame(animate);
}

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" || e.key === "w") movePlayer(0, -1);
    if (e.key === "ArrowDown" || e.key === "s") movePlayer(0, 1);
    if (e.key === "ArrowLeft" || e.key === "a") movePlayer(-1, 0);
    if (e.key === "ArrowRight" || e.key === "d") movePlayer(1, 0);
});

function resetGame() {
    initializeGame();
    gameLoop();
}

// Initialize the game immediately
initializeGame();
gameLoop();
animate();

// Remove the window.load event listener and just keep the reset button listener
newMazeBtn.addEventListener('click', resetGame);

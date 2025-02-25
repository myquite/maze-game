const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Update the base cell size to be larger
const baseCell = 48;
let cellSize = baseCell; // Keep cellSize variable for compatibility with existing code

// Add this near the top of your code with other variable declarations
const timerDisplay = document.getElementById('timer');
let gameActive = false;
let mazeCompleted = false;

// Add minotaur image and properties
const minotaurImg = new Image();
minotaurImg.src = "graphics/minotaur.png";
minotaurImg.onerror = () => console.error("Failed to load minotaur image");

// Add game states and minotaur properties
let gameOver = false;
let minotaur = { x: -1, y: -1, active: false };
let minotaurTimer = null; // Timer for independent movement
const MINOTAUR_MOVE_INTERVAL = 300; // Time in ms between minotaur moves (lower = faster)

// Store the final time as a single value
let finalTime = 0;

// Function to resize the canvas and maze
function resizeCanvas() {
    // Get available screen space (accounting for some margins)
    const maxWidth = window.innerWidth - 20;
    const maxHeight = window.innerHeight - 100; // Room for timer and button
    
    // Calculate how many cells we can fit - fewer cells for a smaller maze
    const maxCols = 15; // Maximum number of columns
    const maxRows = 11; // Maximum number of rows
    
    // Calculate actual dimensions based on available space
    const possibleCols = Math.min(Math.floor(maxWidth / baseCell), maxCols);
    const possibleRows = Math.min(Math.floor(maxHeight / baseCell), maxRows);
    
    // Use odd numbers for better maze layout
    const cols = possibleCols % 2 === 0 ? possibleCols - 1 : possibleCols;
    const rows = possibleRows % 2 === 0 ? possibleRows - 1 : possibleRows;
    
    // Set canvas dimensions
    canvas.width = cols * baseCell;
    canvas.height = rows * baseCell;
    
    console.log(`Canvas resized to ${canvas.width}x${canvas.height}, Grid: ${cols}x${rows}`);
    
    // Return grid dimensions for maze generation
    return { cols, rows };
}

// Basic error check for canvas
if (!canvas) {
    console.error("Canvas element not found!");
} else {
    console.log("Canvas element found, initializing game...");
}

// Call resize and get initial dimensions
const { cols, rows } = resizeCanvas();

// Add window resize handler
window.addEventListener('resize', () => {
    // Store player's relative position
    const playerRelX = player.x / grid[0].length;
    const playerRelY = player.y / grid.length;
    
    // Resize canvas and get new dimensions
    const { cols, rows } = resizeCanvas();
    
    // Regenerate maze with new dimensions
    initializeGame(cols, rows);
    
    // Adjust player position to maintain relative location
    player.x = Math.floor(playerRelX * cols);
    player.y = Math.floor(playerRelY * rows);
});

// Update initializeGame to accept dimensions
function initializeGame(cols, rows) {
    // Initialize grid
    grid = [];
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            grid.push(new Cell(x, y));
        }
    }
    
    // Reset game state
    stack = [];
    current = grid[0];
    current.visited = true;
    player = { x: 0, y: 0 };
    goal = { x: cols - 1, y: rows - 1 };
    startTime = null;
    
    // Generate the maze
    generateFullMaze();
}

// Load textures for path, wall, exit, and player
const pathImg = new Image();
pathImg.src = "graphics/path32.png";
pathImg.onerror = () => console.error("Failed to load path image");

const wallImg = new Image();
wallImg.src = "graphics/brickwall32.png";
wallImg.onerror = () => console.error("Failed to load wall image");

const exitImg = new Image();
exitImg.src = "graphics/exit32.png";
exitImg.onerror = () => console.error("Failed to load exit image");

// Add the player image
const playerImg = new Image();
playerImg.src = "graphics/player.png";
playerImg.onerror = () => console.error("Failed to load player image");

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.walls = { top: true, right: true, bottom: true, left: true };
        this.visited = false;
        
        // Random orientations for visual variety
        this.pathRotation = Math.floor(Math.random() * 4); // 0, 1, 2, or 3 (0, 90, 180, 270 degrees)
        this.wallVariations = {
            top: Math.random() > 0.5,    // Boolean for flipping
            right: Math.random() > 0.5,
            bottom: Math.random() > 0.5,
            left: Math.random() > 0.5
        };
    }
    
    draw() {
        const x = this.x * cellSize;
        const y = this.y * cellSize;
        
        if (this.visited) {
            // Draw path with random rotation
            ctx.save();
            ctx.translate(x + cellSize/2, y + cellSize/2);
            ctx.rotate((Math.PI/2) * this.pathRotation);
            ctx.drawImage(pathImg, -cellSize/2, -cellSize/2, cellSize, cellSize);
            ctx.restore();
        } else {
            ctx.fillStyle = "#111";
            ctx.fillRect(x, y, cellSize, cellSize);
        }
        
        const wallThickness = 4;
        
        // Draw walls with variations
        if (this.walls.top) {
            if (wallImg.complete) {
                ctx.save();
                ctx.translate(x + cellSize/2, y + wallThickness/2);
                // Flip horizontally if variation is true
                if (this.wallVariations.top) {
                    ctx.scale(-1, 1);
                }
                ctx.drawImage(wallImg, -cellSize/2, -wallThickness/2, cellSize, wallThickness);
                ctx.restore();
            } else {
                ctx.fillStyle = "#555";
                ctx.fillRect(x, y, cellSize, wallThickness);
            }
        }
        
        if (this.walls.right) {
            if (wallImg.complete) {
                ctx.save();
                ctx.translate(x + cellSize - wallThickness/2, y + cellSize/2);
                ctx.rotate(Math.PI/2);
                // Flip horizontally if variation is true
                if (this.wallVariations.right) {
                    ctx.scale(-1, 1);
                }
                ctx.drawImage(wallImg, -cellSize/2, -wallThickness/2, cellSize, wallThickness);
                ctx.restore();
            } else {
                ctx.fillStyle = "#555";
                ctx.fillRect(x + cellSize - wallThickness, y, wallThickness, cellSize);
            }
        }
        
        if (this.walls.bottom) {
            if (wallImg.complete) {
                ctx.save();
                ctx.translate(x + cellSize/2, y + cellSize - wallThickness/2);
                // Flip horizontally if variation is true
                if (this.wallVariations.bottom) {
                    ctx.scale(-1, 1);
                }
                ctx.drawImage(wallImg, -cellSize/2, -wallThickness/2, cellSize, wallThickness);
                ctx.restore();
            } else {
                ctx.fillStyle = "#555";
                ctx.fillRect(x, y + cellSize - wallThickness, cellSize, wallThickness);
            }
        }
        
        if (this.walls.left) {
            if (wallImg.complete) {
                ctx.save();
                ctx.translate(x + wallThickness/2, y + cellSize/2);
                ctx.rotate(Math.PI/2);
                // Flip horizontally if variation is true
                if (this.wallVariations.left) {
                    ctx.scale(-1, 1);
                }
                ctx.drawImage(wallImg, -cellSize/2, -wallThickness/2, cellSize, wallThickness);
                ctx.restore();
            } else {
                ctx.fillStyle = "#555";
                ctx.fillRect(x, y, wallThickness, cellSize);
            }
        }
    }
}

let grid = [];
for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
        grid.push(new Cell(x, y));
    }
}

let stack = [];
let current = grid[0];
current.visited = true;

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

let player = { x: 0, y: 0 };
const goal = { x: cols - 1, y: rows - 1 };
let startTime, timer;

// Draw function with error handling
function draw() {
    if (!canvas || !ctx) {
        console.error("Canvas or context is not available!");
        return;
    }
    
    try {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid with fallback
        if (grid && grid.length > 0) {
            grid.forEach(cell => {
                try {
                    cell.draw();
                } catch (e) {
                    // Fallback drawing if cell.draw() fails
                    const x = cell.x * cellSize;
                    const y = cell.y * cellSize;
                    
                    // Draw path or wall
                    ctx.fillStyle = cell.visited ? "#333" : "#111";
                    ctx.fillRect(x, y, cellSize, cellSize);
                    
                    // Draw walls
                    ctx.fillStyle = "#777";
                    if (cell.walls.top) ctx.fillRect(x, y, cellSize, 4);
                    if (cell.walls.right) ctx.fillRect(x + cellSize - 4, y, 4, cellSize);
                    if (cell.walls.bottom) ctx.fillRect(x, y + cellSize - 4, cellSize, 4);
                    if (cell.walls.left) ctx.fillRect(x, y, 4, cellSize);
                }
            });
        } else {
            console.error("Grid is not properly initialized!");
        }
        
        // Draw player using player image
        if (playerImg.complete) {
            ctx.drawImage(playerImg, player.x * cellSize, player.y * cellSize, cellSize, cellSize);
        } else {
            // Fallback if image isn't loaded
            ctx.fillStyle = "blue";
            ctx.fillRect(player.x * cellSize + 5, player.y * cellSize + 5, cellSize - 10, cellSize - 10);
        }
        
        // Draw goal (exit) using the exit image
        if (exitImg.complete) {
            ctx.drawImage(exitImg, goal.x * cellSize, goal.y * cellSize, cellSize, cellSize);
        } else {
            // Fallback if image isn't loaded
            ctx.fillStyle = "red";
            ctx.fillRect(goal.x * cellSize + 10, goal.y * cellSize + 10, cellSize - 20, cellSize - 20);
        }
        
        // Draw minotaur if active
        if (minotaur.active) {
            if (minotaurImg.complete) {
                ctx.drawImage(minotaurImg, minotaur.x * cellSize, minotaur.y * cellSize, cellSize, cellSize);
            } else {
                ctx.fillStyle = "red";
                ctx.beginPath();
                ctx.arc(minotaur.x * cellSize + cellSize/2, minotaur.y * cellSize + cellSize/2, 
                         cellSize/3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw game over overlay
        if (gameOver) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = "red";
            ctx.font = `bold ${Math.floor(cellSize/2)}px ${getComputedStyle(document.body).fontFamily}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2);
            ctx.fillText("The minotaur caught you!", canvas.width/2, canvas.height/2 + cellSize);
        }
        
        // Draw completion overlay
        if (mazeCompleted) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = "lime";
            ctx.font = `bold ${Math.floor(cellSize/1.5)}px ${getComputedStyle(document.body).fontFamily}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("YOU ESCAPED!", canvas.width/2, canvas.height/2 - cellSize/2);
            
            // Use the stored finalTime instead of recalculating
            ctx.font = `bold ${Math.floor(cellSize)}px ${getComputedStyle(document.body).fontFamily}`;
            ctx.fillText(`${finalTime}s`, canvas.width/2, canvas.height/2 + cellSize/2);
        }
    } catch (e) {
        console.error("Error in draw function:", e);
    }
}

// Update the movePlayer function to hide the timer display
function movePlayer(dx, dy) {
    // Don't allow movement if game is over or maze is completed
    if (mazeCompleted || gameOver) return;
    
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
            timer = setInterval(updateTimer, 100);
            
            // Schedule minotaur to start chasing after 5 seconds
            setTimeout(activateMinotaur, 5000);
        }
        
        player.x = nextX;
        player.y = nextY;
        
        // Check for collision with minotaur
        if (player.x === minotaur.x && player.y === minotaur.y && minotaur.active) {
            gameOver = true;
            gameActive = false;
            clearInterval(timer);
            clearInterval(minotaurTimer);
            timerDisplay.textContent = `GAME OVER!`;
            timerDisplay.style.color = "red";
            return;
        }
        
        // Check for completion
        if (player.x === goal.x && player.y === goal.y) {
            // Calculate final time ONCE to ensure consistency
            finalTime = ((Date.now() - startTime) / 1000).toFixed(1);
            
            // Set game state
            mazeCompleted = true;
            gameActive = false;
            
            // Stop all timers immediately
            clearInterval(timer);
            clearInterval(minotaurTimer);
            
            // Hide the timer display at the top completely
            if (timerDisplay) {
                timerDisplay.style.display = 'none';
            }
        }
    }
}

// Update the activateMinotaur function
function activateMinotaur() {
    if (gameActive && !mazeCompleted && !gameOver) {
        console.log("The minotaur is coming!");
        
        // Add a visual warning before minotaur appears
        timerDisplay.textContent = "The Minotaur is coming!";
        timerDisplay.style.color = "red";
        
        // Restore timer display after a brief warning
        setTimeout(() => {
            timerDisplay.style.color = "";
            if (gameActive) updateTimer();
        }, 1500);
        
        // Initialize minotaur at starting position
        minotaur.x = 0;
        minotaur.y = 0;
        minotaur.active = true;
        
        // Start independent movement timer
        if (minotaurTimer) clearInterval(minotaurTimer);
        minotaurTimer = setInterval(() => {
            if (gameActive && !gameOver && !mazeCompleted) {
                moveMinotaur();
                
                // Check for collision after every move
                if (player.x === minotaur.x && player.y === minotaur.y) {
                    gameOver = true;
                    gameActive = false;
                    clearInterval(timer);
                    clearInterval(minotaurTimer);
                    timerDisplay.textContent = `GAME OVER!`;
                    timerDisplay.style.color = "red";
                }
            } else {
                // Stop moving if game is over or completed
                clearInterval(minotaurTimer);
            }
        }, MINOTAUR_MOVE_INTERVAL);
    }
}

// Improved pathfinding algorithm for minotaur
function moveMinotaur() {
    if (!minotaur.active || gameOver || mazeCompleted) return;
    
    // Calculate paths to both player and exit
    const pathToPlayer = findPath(minotaur, player);
    const pathToExit = findPath(minotaur, goal);
    
    // If player is closer to exit than minotaur is to player, intercept at exit
    const useInterception = pathToExit && pathToPlayer && 
                            pathToExit.length < pathToPlayer.length * 1.5;
    
    // Choose which path to follow
    let nextPosition;
    if (useInterception && Math.random() < 0.7) {
        // Try to intercept player at exit by moving toward exit
        console.log("Minotaur intercepting toward exit");
        
        // Find a point along exit path to intercept
        const interceptPoint = Math.floor(pathToExit.length * 0.5); // Halfway to exit
        if (pathToExit.length > interceptPoint) {
            nextPosition = pathToExit[1]; // Next step toward exit (index 0 is current position)
        } else {
            nextPosition = pathToPlayer[1]; // Fallback to chasing directly
        }
    } else if (pathToPlayer && pathToPlayer.length > 1) {
        // Chase player directly
        nextPosition = pathToPlayer[1]; // Next step toward player
    }
    
    // Move the minotaur
    if (nextPosition) {
        minotaur.x = nextPosition.x;
        minotaur.y = nextPosition.y;
        
        // Check if caught player
        if (minotaur.x === player.x && minotaur.y === player.y) {
            gameOver = true;
            gameActive = false;
            clearInterval(timer);
            clearInterval(minotaurTimer);
            timerDisplay.textContent = `GAME OVER!`;
        }
    }
}

// A* pathfinding algorithm
function findPath(start, end) {
    // Priority queue for frontier
    const frontier = [{
        x: start.x,
        y: start.y,
        cost: 0,
        heuristic: manhattanDistance(start, end),
        parent: null
    }];
    
    // Set of visited nodes
    const visited = new Set();
    
    // Find path
    while (frontier.length > 0) {
        // Sort by f = g + h (cost + heuristic)
        frontier.sort((a, b) => (a.cost + a.heuristic) - (b.cost + b.heuristic));
        
        // Get the node with lowest cost
        const current = frontier.shift();
        const currentKey = `${current.x},${current.y}`;
        
        // Mark as visited
        visited.add(currentKey);
        
        // Check if reached goal
        if (current.x === end.x && current.y === end.y) {
            // Reconstruct path
            const path = [];
            let node = current;
            while (node) {
                path.unshift({x: node.x, y: node.y});
                node = node.parent;
            }
            return path;
        }
        
        // Find current cell in the grid
        const cell = grid.find(c => c.x === current.x && c.y === current.y);
        if (!cell) continue;
        
        // Try all possible directions
        const directions = [
            { dx: 0, dy: -1, wall: 'top' },    // Up
            { dx: 1, dy: 0, wall: 'right' },   // Right
            { dx: 0, dy: 1, wall: 'bottom' },  // Down
            { dx: -1, dy: 0, wall: 'left' }    // Left
        ];
        
        for (const dir of directions) {
            // Check if wall exists in this direction
            if (cell.walls[dir.wall]) continue;
            
            const nx = current.x + dir.dx;
            const ny = current.y + dir.dy;
            const neighborKey = `${nx},${ny}`;
            
            // Skip if already visited
            if (visited.has(neighborKey)) continue;
            
            // Compute cost (1 per step)
            const newCost = current.cost + 1;
            
            // Compute heuristic (Manhattan distance to goal)
            const heuristic = manhattanDistance({x: nx, y: ny}, end);
            
            // Check if neighbor is already in frontier with higher cost
            const existingIndex = frontier.findIndex(n => n.x === nx && n.y === ny);
            if (existingIndex >= 0 && frontier[existingIndex].cost > newCost) {
                // Update with better path
                frontier[existingIndex].cost = newCost;
                frontier[existingIndex].parent = current;
            } else if (existingIndex === -1) {
                // Add to frontier
                frontier.push({
                    x: nx,
                    y: ny,
                    cost: newCost,
                    heuristic: heuristic,
                    parent: current
                });
            }
        }
    }
    
    // No path found
    return null;
}

// Helper function for Manhattan distance
function manhattanDistance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Add a function to update the timer display
function updateTimer() {
    if (!startTime || !gameActive) return;
    
    const currentTime = Date.now();
    const elapsedSeconds = ((currentTime - startTime) / 1000).toFixed(1);
    
    if (timerDisplay) {
        timerDisplay.textContent = `Time: ${elapsedSeconds}s`;
    }
}

// Remove this part in the keydown listener:
document.addEventListener("keydown", (e) => {
    // Remove this timer start code
    // if (!startTime) {
    //     startTime = Date.now();
    //     timer = setInterval(() => draw(), 1000 / 60);
    // }
    
    if (e.key === "ArrowUp" || e.key === "w") movePlayer(0, -1);
    if (e.key === "ArrowDown" || e.key === "s") movePlayer(0, 1);
    if (e.key === "ArrowLeft" || e.key === "a") movePlayer(-1, 0);
    if (e.key === "ArrowRight" || e.key === "d") movePlayer(1, 0);
});

function ensureMazeIsComplete() {
    let allVisited = grid.every(cell => cell.visited);
    if (!allVisited) {
        console.log("Maze generation incomplete, finding unvisited cell");
        let unvisited = grid.find(cell => !cell.visited);
        if (unvisited) {
            let closestVisited = grid.filter(cell => cell.visited)
                .sort((a, b) => {
                    let distA = Math.abs(a.x - unvisited.x) + Math.abs(a.y - unvisited.y);
                    let distB = Math.abs(b.x - unvisited.x) + Math.abs(b.y - unvisited.y);
                    return distA - distB;
                })[0];
            
            if (closestVisited) {
                removeWalls(closestVisited, unvisited);
                unvisited.visited = true;
            }
        }
    }
}

function gameLoop() {
    generateMaze();
    draw();
    if (stack.length > 0) {
        requestAnimationFrame(gameLoop);
    } else {
        ensureMazeIsComplete();
        draw();
        console.log("Maze generation complete");
    }
}
gameLoop();

// Add this after your other initialization code
const newMazeBtn = document.getElementById('newMazeBtn');
if (newMazeBtn) {
    newMazeBtn.addEventListener('click', resetGame);
} else {
    console.error("New Maze button not found!");
}

// Update or add the resetGame function
function resetGame() {
    console.log("Resetting game and generating new maze...");
    
    // Reset timer and game state
    if (timer) clearInterval(timer);
    if (minotaurTimer) clearInterval(minotaurTimer);
    
    startTime = null;
    gameActive = false;
    mazeCompleted = false;
    gameOver = false;
    
    // Reset minotaur
    minotaur = { x: -1, y: -1, active: false };
    
    // Reset and show timer display
    if (timerDisplay) {
        timerDisplay.textContent = 'Time: 0.0s';
        timerDisplay.style.color = ""; // Reset to default color
        timerDisplay.style.display = ""; // Show it again
    }
    
    // Reset game state
    player = { x: 0, y: 0 };
    
    // Get current dimensions
    const currentCols = cols;
    const currentRows = rows;
    
    // Initialize new grid with same dimensions
    grid = [];
    for (let y = 0; y < currentRows; y++) {
        for (let x = 0; x < currentCols; x++) {
            grid.push(new Cell(x, y));
        }
    }
    
    // Reset maze generation variables
    stack = [];
    current = grid[0];
    current.visited = true;
    
    // Generate new maze
    while (current) {
        let next = getNeighbors(current).sort(() => Math.random() - 0.5)[0];
        if (next) {
            next.visited = true;
            stack.push(current);
            removeWalls(current, next);
            current = next;
        } else if (stack.length > 0) {
            current = stack.pop();
        } else {
            current = null; // End generation
        }
    }
    
    // Make sure the entire maze is visited
    ensureMazeIsComplete();
    
    // Update display
    draw();
    
    // Reset stored values
    finalTime = 0;
}

// Add a game animation loop function
function animate() {
    // Redraw the maze
    draw();
    
    // Request the next frame
    requestAnimationFrame(animate);
}

// Call the animation function to start the rendering loop
animate();
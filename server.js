const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const Cell = require("./Cell");
const Food = require("./Food");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let cells = {};
let foods = {};

let WIDTH = 800;
let HEIGHT = 600;

let foodId = 0;
let initialCellRadius = 50;

function createFood(x, y) {
    let id = foodId++;
    let radius = 5;
    let color = "blue";

    let food = new Food(id, x, y, radius, color);
    foods[id] = food;
    console.log(WIDTH, HEIGHT);
}

for (let i = 0; i < 10; i++) {
    let x = Math.floor(Math.random() * WIDTH);
    let y = Math.floor(Math.random() * HEIGHT);
    createFood(x, y);
}

function checkCollision(a, b) {
    const distance = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    return distance < a.radius + b.radius;
}

function handleCellFoodCollision(cell, food) {
    if (checkCollision(cell, food)) {
        cell.radius += 0.5;
        delete foods[food.id];
    }
}

function handleCellCellCollision(cell1, cell2) {
    if (checkCollision(cell1, cell2)) {
        if (cell1.radius > cell2.radius) {
            cell1.radius += cell2.radius;
            delete cells[cell2.id];
        } else if (cell2.radius < cell2.radius) {
            cell2.radius += cell1.radius;
            delete cells[cell1.id];
        }
    }
}

io.on("connection", (socket) => {
    let socketUpdateInterval = setInterval(() => {
        io.sockets.emit("update", { cells, foods });
    }, 1000 / 60);

    socket.on("windowDimensionInfo", (windowDimensionInfo) => {
        WIDTH = windowDimensionInfo.windowWidth;
        HEIGHT = windowDimensionInfo.windowHeight;

        cells[socket.id] = new Cell(
            socket.id,
            Math.floor(Math.random() * WIDTH),
            Math.floor(Math.random() * HEIGHT),
            initialCellRadius,
            "yellow"
        );
    });

    socket.emit("welcome", { id: socket.id });

    socket.on("update", (cellData) => {
        if (cells[socket.id]) {
            cells[socket.id] = cellData;
        }

        let cell = cells[socket.id];

        for (let id in foods) {
            let food = foods[id];
            handleCellFoodCollision(cell, food);
        }

        for (let id in cells) {
            if (id == socket.id) continue;
            let otherCell = cells[id];
            handleCellCellCollision(cell, otherCell);
        }
    });

    socket.on("disconnect", () => {
        clearInterval(socketUpdateInterval);
        console.log("Client disconnected");
        delete cells[socket.id];
    });
});

const port = 3005;

app.use(express.static("public"));
server.listen(port, () => console.log("Server listening on port " + port));

setInterval(() => {
    Object.keys(cells).map((key) => {
        let cell = cells[key];
        createFood(
            cell.x + Math.random() * 2 * WIDTH - WIDTH,
            cell.y + Math.random() * 2 * HEIGHT - HEIGHT
        );
    });
}, [30]);

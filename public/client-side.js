let socket = io();

let cells = {};
let foods = {};
let myCellId = "";

let cellVelocity;

socket.on("update", (data) => {
    cells = data.cells;
    foods = data.foods;
});

socket.on("welcome", (data) => {
    myCellId = data.id;
    console.log(data.id);
});

function setup() {
    cellVelocity = createVector(0, 0);
    socket.emit("windowDimensionInfo", {
        windowWidth: windowWidth,
        windowHeight: windowHeight,
    });
    createCanvas(windowWidth, windowHeight);
}

function draw() {
    background(225);

    let cell = cells[myCellId];

    if (!cell) {
        return;
    }

    let scaleFactor = 64 / cell.radius;
    // scaleFactor = constrain(scaleFactor, 0.5, 2);

    let translateX = width / 2 - cell.x * scaleFactor;
    let translateY = height / 2 - cell.y * scaleFactor;

    for (let id in cells) {
        let otherCell = cells[id];
        if (otherCell.color) {
            fill(otherCell.color);
        }
        let otherCellSize = otherCell.radius * 2 * scaleFactor;
        ellipse(
            otherCell.x * scaleFactor + translateX,
            otherCell.y * scaleFactor + translateY,
            otherCellSize
        );
    }

    for (let id in foods) {
        let food = foods[id];
        fill(food.color);
        let foodSize = food.radius * 2 * scaleFactor;
        ellipse(
            food.x * scaleFactor + translateX,
            food.y * scaleFactor + translateY,
            foodSize
        );
    }
}

setInterval(mouseMove, [10 / 1000])

function mouseMove() {
    let cell = cells[myCellId];

    console.log(mouseX + " | " + width)
    if(mouseX < 0 || mouseX > windowWidth) return;
    if(mouseY < 0 || mouseY > windowHeight) return;

    if (cell) {
        cellVelocity = createVector(mouseX - windowWidth / 2, mouseY - windowHeight / 2);
        speedLimit = Math.min(cell.radius / 100, 1.5)
        cellVelocity.limit(3 - speedLimit);

        cell.x += cellVelocity.x;
        cell.y += cellVelocity.y;
        socket.emit("update", cell);
    }
}

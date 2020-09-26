function Cell(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
}


function Sheet() {
    this.cells = null;
    this.height = null;
    this.width = null;
    this.selected = null; // Cell
    this.goal = null; // Point
}


Sheet.prototype.moveSelection = function(direction, moveType) {
    let h = this.selected.x;
    let v = this.selected.y;

    let incrementX = 0;
    let incrementY = 0;
    if (direction === 'ArrowUp')
        incrementY = -1;
    else if (direction === 'ArrowDown')
        incrementY = 1;
    else if (direction === 'ArrowLeft')
        incrementX = -1;
    else if (direction === 'ArrowRight')
        incrementX = 1;
    h += incrementX;
    v += incrementY;

    let startIsFilled = (this.selected.value !== ' ');
    let lastCell = this.selected;
    let nextCell = 0 <= v && v < this.height && 0 <= h && h < this.width && new Cell(h, v, this.cells[v][h]);
    let nextIsFilled = (nextCell && nextCell.value !== ' ');
    let stopCondition = !(startIsFilled && nextIsFilled);

    let numberOfSteps = (moveType === 'skip' ? -1 : 1);
    let stepsTaken = 0;

    while (nextCell) {
        // check steps within the loop in case we can't take a step w/o being OOB
        stepsTaken += 1;
        if (stepsTaken === numberOfSteps)
            break;
        
        nextIsFilled = (nextCell.value !== ' ');
        if (nextIsFilled === stopCondition) {
            if (!stopCondition) // if stoppiing at end of filled row, clear nextCell so that lastCell is selected
                nextCell = null;
            break;
        }

        h += incrementX;
        v += incrementY;
        lastCell = nextCell;
        nextCell = 0 <= v && v < this.height && 0 <= h && h < this.width && new Cell(h, v, this.cells[v][h]);
    }
    this.selectCell(nextCell || lastCell); // use the last if the next is undefined
};


Sheet.prototype.selectCell = function(cell) {
    if (this.selected.x === cell.x && this.selected.y === cell.y)
        return;
    this.selected = cell;
};


Sheet.prototype.selectXY = function(x, y) {
    if (this.selected.x === x && this.selected.y === y)
        return;
    this.selected = new Point(x, y, this.cells[y][x]);
};


Sheet.prototype.loadLevel = function(cells) {
    this.cells = cells;
    this.height = cells.length;
    this.width = cells.reduce((lastMax, row) => Math.max(lastMax, row.length), 0);
    this.selected = new Cell(0, 0, cells[0][0]);

    for(var v = 0; v < cells.length; v++)
        for (var h = 0; h < cells[v].length; h++)
            if (cells[v][h] == 'X') {
                this.goal = new Point(h, v);
                return;
            }
    // the loops above *should* find a goal, otherwise throw an error
    throw 'no goal found';
};


Sheet.prototype.updateSelectedCellValue = function(str) {
    this.selected.value = str;

    const x = this.selected.x;
    const y = this.selected.y;
    const row = this.cells[y];
    this.cells[y] = row.slice(0, x) + str + row.slice(x + 1);
};


Sheet.prototype.export = function() {
    return this.cells;
};

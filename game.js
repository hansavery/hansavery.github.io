function Game() {
    this.sheet = new Sheet();
    const tblcontainer = document.getElementById('tblcontainer');
    this.tbl = tblcontainer.children[0];
    this.view = new View(this.sheet, tblcontainer);
    this.startGame();
};


Game.prototype.startGame = function(level) {
    this.sheet.loadLevel(LEVELS[0]);
    this.sheet.selectXY(0, 0);

    this.view.makeGrid();
    this.view.paint();

    this.tbl.onclick = this.createClickHandler();
    document.onkeydown = this.createKeyHandler();
};


Game.prototype.createClickHandler = function() {
    self = this;
    return function (event) {
        if (!event.target || event.target.nodeName !== 'TD')
            return;
        if (event.shift) {
            alert('not implemented yet')    
        }
        else {
            if (event.target.classList.contains('rowLabel'))
                selectRow(event.target);
            else if (event.target.classList.contains('colLabel'))
                selectCol(event.target);
            else {
                target = self.view.translateTarget(event.target);
                self.sheet.selectXY(target.x, target.y);
                self.view.paint();
                self.checkForWin();
            }
        }
    };
};


Game.prototype.createKeyHandler = function() {
    self = this;
    directions = ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown']
    return function keyHandler(event) {
        event = event || window.event;
        let key = event.key;
        if (directions.indexOf(key) !== -1) {
            let moveType = event.ctrlKey ? 'skip' : 'step';
            self.sheet.moveSelection(key, moveType);
            event.preventDefault();
            event.stopPropagation();
        }
        else if (key === 'Delete') {
            self.sheet.updateSelectedCellValue('');
            self.view.updateCellValue('');
            event.preventDefault();
            event.stopPropagation();
        }
        else if (key.length === 1 && !event.ctrlKey &&
                 (  ('a' <= key && key <= 'z') ||
                    ('A' <= key && key <= 'Z') ||
                    ('0' <= key && key <= '9'))){
            self.sheet.updateSelectedCellValue(key);
            self.view.updateCellValue(key);
            event.preventDefault();
            event.stopPropagation();
        }
        self.view.paint();
        self.checkForWin();
    };
};


Game.prototype.checkForWin = function() {
    if (this.sheet.selected.x !== this.sheet.goal.x || this.sheet.selected.y !== this.sheet.goal.y)
        return;
    this.tbl.onclick = null;
    document.onkeydown = null;
    this.showWin()
};


Game.prototype.showGame = function() {
    document.getElementById('winMenu').style.visibility = 'hidden';
    document.getElementById('winMenu').style.display = 'none';
    document.getElementById('tbl').style.visibility = 'visible';
    document.getElementById('tbl').style.display = 'inline-block';
    document.getElementById('tblcontainer').style.overflow = 'scroll';
    this.startGame();
};


Game.prototype.showWin = function() {
    document.getElementById('winMenu').style.visibility = 'visible';
    document.getElementById('winMenu').style.display = 'inline-block';
    document.getElementById('tbl').style.visibility = 'hidden';
    document.getElementById('tbl').style.display = 'none';
    document.getElementById('tblcontainer').style.overflow = 'hidden';
    document.getElementById('winMenu').onclick = this.showGame.bind(this);
};


const sheetGame = new Game();

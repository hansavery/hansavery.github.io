let DEBUG = false;

function Timer(el) {
    this.el = el;
    this.startTime = null;
    this.endTime = null;
    this.text = null;
    this.intervalId = null;
}

Timer.prototype.start = function() {
    this.startTime = Date.now();
    this.endTime = null;
    this.intervalId = setInterval(this.update.bind(this), 1000);
    if (this.el)
        this.el.innerText = '00:00.000';
};

Timer.prototype.update = function() {
    let currTime = null;
    let diff = null;
    if (this.endTime){
        currTime = this.endTime;
        diff = currTime - this.startTime;
    }
    else {
        currTime = Date.now();
        diff = currTime - this.startTime;
        diff = diff - (diff % 1000);
    }

    const millis = diff % 1000;
    const sec = ((diff - millis) / 1000) % 60;
    const min = ((diff - millis - sec * 1000) / 60000) % 60;
    
    const ms = ('000' + String(millis)).slice(-3);
    const ss = ('0' + String(sec)).slice(-2);
    const mm = ('0' + String(min)).slice(-2);
    const mmssmmm = min < 59 ? mm + ':' + ss + '.' + ms : ':(';
    this.text = mmssmmm;
    if (this.el)
        this.el.innerText = mmssmmm;
};

Timer.prototype.end = function() {
    this.endTime = Date.now();
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.update();
}

function Game(level) {
    this.levels = LEVELS;
    this.sheet = new Sheet();
    const tblcontainer = document.getElementById('tblcontainer');
    this.tbl = document.getElementById('tbl');
    this.view = new View(this.sheet, tblcontainer, this.tbl);
    this.level = level;
    this.timer = new Timer(document.getElementById('timer'));
    this.popover = document.getElementById('popover');
    this.popoverHeader = document.getElementById('popoverHeader');

    callback = this.startLevel.bind(this, level);
    this.showPopover('Click here to race', callback);
};


Game.prototype.startGame = function(levelNumber) {
    level = this.levels[levelNumber];
    this.sheet.loadLevel(level.cells);
    this.currentLevelRecord = level.record;
    this.sheet.selectXY(0, 0);

    this.view.makeGrid();
    this.view.paint(0);

    this.timer.start();

    this.tbl.onclick = this.createClickHandler();
    document.onkeydown = this.createKeyHandler();

    this.startTime = Date.now();
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
                self.view.paint(Date.now() - this.startTime);
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
        else if (key === 'Enter') {
            self.sheet.moveSelection(event.shiftKey ? 'ArrowUp' : 'ArrowDown', 'step');
            event.preventDefault();
            event.stopPropagation();
        }
        else if (key === 'Tab') {
            self.sheet.moveSelection(event.shiftKey ? 'ArrowLeft' : 'ArrowRight', 'step');
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
        else if (DEBUG === true)
            alert(key);
        self.view.paint(Date.now() - this.startTime);
        self.checkForWin();
    };
};


Game.prototype.checkForWin = function() {
    if (this.sheet.selected.x !== this.sheet.goal.x || this.sheet.selected.y !== this.sheet.goal.y)
        return;
    this.timer.end();
    this.tbl.onclick = null;
    document.onkeydown = null;
    this.showWin()
};


Game.prototype.showPopover = function(html, onclick) {
    this.popover.classList.remove('hidden');
    this.popover.onclick = onclick;    
    this.popoverHeader.innerHTML = html
    this.tbl.classList.add('hidden');
};


Game.prototype.showGame = function() {
    this.popover.classList.add('hidden');
    this.popover.onclick = null;
    this.tbl.classList.remove('hidden')    
};


Game.prototype.startLevel = function(level) {
    this.startGame(level)
    this.showGame();
};

Game.prototype.showWin = function() {
    this.level += 1;
    if (this.level < this.levels.length) {
        callback = this.startLevel.bind(this, this.level);
        this.showPopover('you win! your time is ' + this.timer.text + ' the record is ' + this.currentLevelRecord, callback);
    }
    else
        this.showPopover('yay! your time is ' + this.timer.text + ' the record is ' + this.currentLevelRecord, null);
};


Game.prototype.exportLevel = function() {
    cells = this.sheet.export();
    time = this.timer.endTime || '99:99.999';
    time = this.currentLevelRecord || this.timer.endTime;
    level = {'record': time, 'cells': cells};
    this.showPopover('<a id="clickToCopy" href="javascript:;">click to copy</a>', this.showGame.bind(this));
    document.getElementById('clickToCopy').onclick = () => {
        navigator.clipboard.writeText(JSON.stringify(level));
    };
};


const sheetGame = new Game(0);




// save times in ms, convert on display!
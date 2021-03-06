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
    const gameContainer = document.getElementById('gameContainer');
    this.tbl = document.getElementById('tbl');
    this.view = new View(this.sheet, gameContainer, this.tbl, true);
    this.level = level;
    this.timer = new Timer(document.getElementById('timer'));
    this.popover = document.getElementById('popover');
    this.popoverHeader = document.getElementById('popoverHeader');

    callback = this.startGame.bind(this, level);
    this.showPopover('<img src="./splash.svg"><h2>Excel shortcuts, first to the <span class="goal example">X</span> wins.</h2><h2>Hope you have a keyboard.</h2><h2>Click to start the countdown.</h2>', callback);

    this.mode = '';
    this.cheated = false;
};


Game.prototype.startGame = function(levelNumber) {
    this.mode = 'play';
    this.cheated = false;
    this.events = [];

    level = this.levels[levelNumber];
    this.sheet.loadLevel(level.cells);
    this.currentLevelRecord = level.record;
    this.sheet.selectXY(0, 0);

    this.showGame();
    this.view.makeGrid();
    this.view.paint(0);
    window.onresize = this.createResizeHandler();

    this.countdown(3, start.bind(this));

    function start() {
        this.timer.start();

        this.tbl.onclick = this.createClickHandler();
        document.onkeydown = this.createKeyHandler();
    
        this.startTime = Date.now();    
    }
};


Game.prototype.startEditor = function(x, y) {
    this.mode = 'edit';
    this.events = [];

    cells = ['X' + ' '.repeat(x - 1)];
    for (let i = 1; i < y; i++)
        cells.push(' '.repeat(x));
    this.sheet.loadLevel(cells);
    this.currentLevelRecord = '00:01.001'
    this.sheet.selectXY(0, 0);

    this.view.makeGrid();
    this.view.paint(0);

    this.timer.start();

    this.tbl.onclick = this.createClickHandler();
    document.onkeydown = this.createKeyHandler();

    this.startTime = Date.now();
    this.showGame();
};


Game.prototype.createResizeHandler = function() {
    self = this;
    return function (event) {
        self.view.adjustGrid();
    };
};


Game.prototype.createClickHandler = function() {
    self = this;
    return function (event) {
        if (!event.target || event.target.nodeName !== 'TD')
            return;
        self.cheated = true;
        if (event.shift) {
            console.log('selections not implemented yet');
        }
        else {
            if (event.target.classList.contains('rowLabel')) {
                selectRow(event.target);
                self.events.push([Date.now(), 'selectRow', event.target.innerHTML]);
            }
            else if (event.target.classList.contains('colLabel')) {
                selectCol(event.target);
                self.events.push([Date.now(), 'selectCol', event.target.innerHTML]);
            }
            else {
                target = self.view.translateTarget(event.target);
                self.sheet.selectXY(target.x, target.y);
                self.view.paint(Date.now() - this.startTime);
                self.events.push(Date.now(), 'selectCell', event.target.id);
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
        self.events.push(event)
        let key = event.key;
        let keyCode = event.keyCode;
        if (directions.indexOf(key) !== -1) {
            let moveType = event.ctrlKey ? 'skip' : 'step';
            self.sheet.moveSelection(key, moveType);
            event.preventDefault();
            event.stopPropagation();
        }
        else if (key === 'PageUp' || key === 'PageDown') {
            let direction = key;
            let steps = self.view.height;
            if (event.altKey) {
                direction += 'Alt'
                steps = self.view.width;
            }
            self.sheet.moveSelection(direction, 'step', steps);
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
            self.sheet.updateSelectedCellValue(' ');
            self.view.updateCellValue(' ');
            event.preventDefault();
            event.stopPropagation();
        }
        else if (key.length === 1 &&
                 !event.ctrlKey &&
                ( // the section in this parens group is with many thanks to https://stackoverflow.com/a/12467610/1861720
                    (keyCode > 47 && keyCode < 58)   || // number keys
                    (keyCode == 59)                  || // ;
                    (keyCode > 64 && keyCode < 91)   || // letter keys
                    (keyCode > 95 && keyCode < 112)  || // numpad keys
                    (keyCode > 186 && keyCode < 193) || // =,-./` (in order)
                    (keyCode > 218 && keyCode < 223) || // [\]' (in order)
                    keyCode === 32 // spacebar
                )) {
            self.sheet.updateSelectedCellValue(key);
            self.view.updateCellValue(key);
            event.preventDefault();
            event.stopPropagation();
        }
        else if (DEBUG === true)
            alert(key + ' ' + String(keyCode));
        self.view.paint(Date.now() - this.startTime);
        self.checkForWin();
    };
};


Game.prototype.checkForWin = function() {
    if (this.sheet.selected.x !== this.sheet.goal.x || this.sheet.selected.y !== this.sheet.goal.y || this.mode === 'edit')
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


Game.prototype.showWin = function() {
    this.level += 1;
    if (this.level < this.levels.length) {
        callback = this.startGame.bind(this, this.level);
        this.showPopover('you win! your time is ' + this.timer.text + ' the record is ' + this.currentLevelRecord, callback);
    }
    else {
        let winner = this.timer.text < this.currentLevelRecord;
        let img = winner ? '<img src="./win.svg"></img>' : '<img src="./lose.svg"></img>';
        let line1 = '<h2>Your time was ' + this.timer.text + '</h2>'
            let line2 = '<h2>My best is ' + this.currentLevelRecord + '</h2>';
        let line3 = '<h2>';
        if (!winner)
            line3 += '';
        else if (this.cheated)
            line3 += "Using the mouse kind of misses the point, don't you think? :(";
        else
            line3 += 'Congratulations!';
        line3 += '</h2>'
        let line4 = '<h2>Click to play again</h2>';
        let line5 = '<h2>Should I make more? Send me an email or tweet @hans_avery to let me know what you think.</h2>';
        this.showPopover(img + line1 + line2 + line3 + line4 + line5, this.startGame.bind(this, 0));
    }
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


Game.prototype.countdown = function(seconds, callback) {
    let remaining = seconds;
    let countdown = document.createElement('ul');
    let container = document.getElementById('gameContainer');
    countdown.classList.add('countdown');
    container.appendChild(countdown);

    updateCountdown()
    let intervalId = setInterval(updateCountdown, 1000);

    function updateCountdown() {
        if (!remaining) {
            clearInterval(intervalId);
            container.removeChild(countdown);
            callback();
        }
        num = document.createElement('li');
        num.innerText = remaining;
        countdown.appendChild(num);
        setTimeout(() => {num.classList.add('fadeout');}, 250);
        remaining--;
    }
}


const sheetGame = new Game(0);

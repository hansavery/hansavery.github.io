function Point(x, y) {
    this.x = x;
    this.y = y;
}


function View(sheet, tblContainer, tbl) {
    this.cells = null;
    this.selected = null;
    this.rowLabels = null;
    this.colLabels = null;
    this.corner = null;

    this.tblContainer = tblContainer;
    this.tbl = tbl;
    this.sheet = sheet;
    this.rowHeights = new Array(sheet.height + 1).fill('1.5em');
    this.colWidths = new Array(sheet.width + 1).fill('2.5em');
}


View.prototype.makeGrid = function() {
    this.tearDown();

    this.cells = [];
    this.colLabels = [];
    this.rowLabels = [];
  
    // make header
    let header = document.createElement('thead');
    this.tbl.appendChild(header);
    let rowEl = document.createElement('tr');

    // top corner
    let cellEl = getCell('th', 0, 0, this.rowHeights[0], this.colWidths[0], 'corner', ' ');
    rowEl.appendChild(cellEl);
    this.corner = cellEl

    // rest of header row
    for (let h = 1; h < this.sheet.width + 1; h++) {
        cellEl = getCell('th', h, 0, this.rowHeights[0], this.colWidths[h], 'colLabel', getLetterCode(h));
        rowEl.appendChild(cellEl);
        this.colLabels.push(cellEl);
    }
    header.appendChild(rowEl);
    
    // data rows
    let body = document.createElement('tbody');
    this.tbl.appendChild(body)
    for (let i = 1, v = 0; i < this.sheet.height + 1; i++, v++) {
        rowEl = document.createElement('tr');
        
        // make row header
        cellEl = getCell('th', 0, i, this.rowHeights[i], this.colWidths[0], 'rowLabel', i);
        rowEl.appendChild(cellEl);
        this.rowLabels.push(cellEl);

        // fill row
        let row = []
        for (let j = 1, h = 0; j < this.sheet.width + 1; j++, h++) {
            cellEl = getCell('td', h, v, this.rowHeights[i], this.colWidths[j], 'cell', '');
            val = this.sheet.cells[v][h]
            cellEl.innerText = val;
            if (val == 'X')
                cellEl.classList.add('goal');
            else {
                // let idx = CHARS.indexOf(val);
                // cellEl.bgColor = COLORS[idx];
                ;
            }
            rowEl.appendChild(cellEl);
            row.push(cellEl);
        }

        body.appendChild(rowEl);
        this.cells.push(row);
    }        

    // functions used above
    function getCell(type, h, v, height, width, cssClass, text) {
        let cellEl = document.createElement(type);
        cellEl.style.minheight = height;
        cellEl.style.minwidth = width;
        cellEl.id = h + ',' + v
        cellEl.classList.add(cssClass);
        cellEl.innerText = text;
        return cellEl;
    }

    function getLetterCode(num) {
        let code = [];
        let remaining = num;
        while (remaining > 0) {
            let nextChar = ((remaining - 1) % 26) + 1;
            remaining = (remaining - nextChar) / 26;
            code.push(String.fromCharCode(64 + nextChar));
        }
        code.reverse();
        return code.join('');
    }
};


View.prototype.paint = function() {
    const cell = this.cells[this.sheet.selected.y][this.sheet.selected.x];
    if (cell === this.selected)
        return;
    else if (this.selected) {
        this.selected.classList.remove('selected');
        const priorCoordinates = this.selected.id.split(',')
        const priorx = parseInt(priorCoordinates[0]);
        const priory = parseInt(priorCoordinates[1]);

        this.rowLabels[priory].classList.remove('selected');
        this.colLabels[priorx].classList.remove('selected');
    }
    cell.classList.add('selected');
    this.selected = cell;
    const coordinates = cell.id.split(',');
    const x = parseInt(coordinates[0]);
    const y = parseInt(coordinates[1]);
    this.rowLabels[y].classList.add('selected')
    this.colLabels[x].classList.add('selected')
    scrollSelection(cell, this.tblContainer, this.rowLabels, this.colLabels);

    function scrollSelection(cell, container, rowLabels, colLabels) {
        const parts = cell.id.split(",");
        const h = parseInt(parts[0]);
        const v = parseInt(parts[1]);

        if (v === 0)
            container.scrollTop = 0;
        else {
            const labelHeight = colLabels[0].clientHeight;
            if (container.scrollTop > cell.offsetTop - labelHeight)
                container.scrollTop = cell.offsetTop - labelHeight;
            else if (container.scrollTop + container.clientHeight < cell.offsetTop + cell.clientHeight)
                container.scrollTop = cell.offsetTop + cell.clientHeight - container.clientHeight;
        }

        if (h === 0)
            container.scrollLeft = 0;
        else {
            const labelWidth = rowLabels[0].clientWidth;
            if (container.scrollLeft > cell.offsetLeft - labelWidth)
                container.scrollLeft = cell.offsetLeft - labelWidth;
            else if (container.scrollLeft + container.clientWidth < cell.offsetLeft + cell.clientWidth)
                container.scrollLeft = cell.offsetLeft + cell.clientWidth - container.clientWidth;        
        }
    }

};


View.prototype.translateTarget = function(target) {
    const coords = target.id.split(',');
    return new Point(parseInt(coords[0]), parseInt(coords[1]));
};




// https://stackoverflow.com/a/5624139
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  
  function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }


// https://stackoverflow.com/a/17243070 with edits
/* accepts parameters
 * h  Object = {h:x, s:y, v:z}
 * OR 
 * h, s, v
*/
function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    r = Math.round(r * 255);
    g = Math.round(g * 255);
    b = Math.round(b * 255);
    console.log(h, s, v, r, g, b);

    return rgbToHex(r, g, b);
}


CHARS = '`1234567890-=qwertyuiop[]\\asdfghjkl;\'zxcvbnm,./~!@#$%^&*()_+QWERTYUIOP{}|ASDFGHJKL:"ZXCVBNM<>? ';
COLORS = []
let l = 1;
let s = 0.4;
for (let j = 0; j < 13; j++) { // remaining num row
    h = j / 13;
    COLORS.push(HSVtoRGB(h, s, l));
}
s = 0.6;
for (let j = 0; j < 13; j++) { // qwer row
    h = j / 13;
    COLORS.push(HSVtoRGB(h, s, l));
}
s = 0.8;
for (let j = 0; j < 11; j++) { // asdf row
    h = j / 11;
    COLORS.push(HSVtoRGB(h, s, l));
}
s = 1;
for (let j = 0; j < 10; j++) { // zxcv row
    h = j / 10;
    COLORS.push(HSVtoRGB(h, s, l));
}
l = .8
for (let j = 0; j < 13; j++) { // num row
    h = j / 13;
    COLORS.push(HSVtoRGB(h, s, l));
}
l = .6
for (let j = 0; j < 13; j++) { // qwer row
    h = j / 13;
    COLORS.push(HSVtoRGB(h, s, l));
}
l = .4
for (let j = 0; j < 11; j++) { // asdf row
    h = j / 11;
    COLORS.push(HSVtoRGB(h, s, l));
}
l = .2
for (let j = 0; j < 10; j++) { // zxcv row
    h = j / 10;
    COLORS.push(HSVtoRGB(h, s, l));
}
COLORS.push('#ffffff');


View.prototype.updateCellValue = function(str) {
    this.selected.innerText = str;
    if (str == 'X')
        this.selected.classList.add('goal');
    else {
        this.selected.classList.remove('goal');
        // let idx = CHARS.indexOf(str);
        // this.selected.bgColor = COLORS[idx];
    }

    
};


View.prototype.tearDown = function() {
    while (this.tbl.childNodes.length > 0)
        this.tbl.removeChild(this.tbl.childNodes[0]);
    this.selected = null;
};

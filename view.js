function Point(x, y) {
    this.x = x;
    this.y = y;
}


function View(sheet, tblContainer, tbl, color) {
    this.cells = null;
    this.selected = null;
    this.rowLabels = null;
    this.colLabels = null;
    this.corner = null;

    this.tblContainer = tblContainer;
    this.tbl = tbl;
    this.sheet = sheet;
    this.color = color;

    this.cells = [];
    this.rowHeaders = [];
    this.columnHeaders = [];

    this.h = 0;
    this.v = 0;
    this.width = 0;
    this.height = 0;

    this.fullChar = '•';
    this.displayChars = false;
}


View.prototype.makeGrid = function() {
    // reset table
    this.tearDown();
    this.rowHeight = '1.5em';
    let digits = Math.ceil(Math.log(this.sheet.width) / Math.log(26));
    this.colWidth = String(digits + 1) + 'em';

    // make columns
    let colgroup = document.createElement('colgroup');
    let col = document.createElement('col');
    col.style.minWidth = this.colWidth;
    colgroup.appendChild(col);
    this.tbl.appendChild(colgroup);

    // make top corner
    let body = document.createElement('tbody');
    let row = document.createElement('tr');
    let cell = document.createElement('th');
    cell.innerText = 'X';
    cell.id = '0,0';
    cell.classList.add('corner');
    this.corner = cell;
    row.appendChild(cell);
    body.appendChild(row);
    this.tbl.appendChild(body); // do this last so that there are no display recalcs until it is done

    // run same adjustment as on window resize
    this.adjustGrid()
    cell.innerText = '';
};


View.prototype.adjustGrid = function() {
    // Changing columns is more work then changing rows. In order to minimize number of rows on which columns need to be adjusted, follow this order:
    //      remove rows if needed >> add/remove columns >> add rows if needed
    
    let tbody = this.tbl.getElementsByTagName('tbody')[0];

    // remove rows
    let availableHeight = Math.floor(this.tblContainer.clientHeight);
    let tableHeight = tbody.clientHeight;
    let rowsRemoved = availableHeight < tableHeight;
    if (rowsRemoved && tbody.childElementCount != this.height + 1) // plus 1 for header
        throw 'Row mismatch';
    while (availableHeight < tableHeight && this.height) {
        let row = tbody.children[this.height]; // row[0] is header, so row[x] is data row x
        tbody.removeChild(row);
        this.cells.pop();
        this.rowHeaders.pop();
        tableHeight = tbody.clientHeight;
        this.height--;
    }

    // adjust columns
    let colgroup = this.tbl.getElementsByTagName('colgroup')[0];
    let availableWidth = Math.floor(this.tblContainer.clientWidth);
    let tableWidth = tbody.clientWidth;
    if (tableWidth < availableWidth) {
        let colWidthPx = tbody.children[0].children[0].clientWidth;
        while (tableWidth + colWidthPx <= availableWidth && this.width < this.sheet.width) {
            // colgroup 
            let col = document.createElement('col');
            col.style.minWidth = this.colWidth;
            colgroup.appendChild(col);

            // header
            let row = tbody.children[0];
            let cell = document.createElement('th');
            let h = String(this.width + 1) + ','; // cell ids are h,v coordinates
            cell.id = h + '0';
            cell.innerText = getLetterCode(this.width + 1);
            this.columnHeaders.push(cell);
            row.appendChild(cell);
            
            // remainder of col
            for (let i = 1; i < tbody.childElementCount; i++) {
                row = tbody.children[i];
                cell = document.createElement('td');
                cell.id = h + String(i);
                this.cells[i - 1].push(cell);
                row.appendChild(cell);
            }
            
            tableWidth = tbody.clientWidth;
            this.width++;
        }

    }
    else {
        if (tbody.children[0].childElementCount != this.width + 1) // plus 1 for header
            throw 'Column` mismatch';
        while (tableWidth > availableWidth && this.width) { // remove columns until they fit
            // colgroup
            let col = colgroup.children[this.width];
            colgroup.removeChild(col);

            // header
            let row = tbody.children[0];
            let cell = row.children[this.width];
            row.removeChild(cell);
            
            //body
            for (let i = 1; i < tbody.childElementCount; i++) {
                row = tbody.children[i];
                cell = row.children[this.width];
                this.cells[i - 1].pop(); // translate from table coordinates to cell coordinates
                row.removeChild(cell);
            }

            tableWidth = tbody.clientWidth;
            this.columnHeaders.pop();
            this.width--;
        }
    }

    // add rows
    if (!rowsRemoved) {
        let rowHeightPx = tbody.children[this.height].clientHeight;
        while (tableHeight + rowHeightPx < availableHeight && this.height < this.sheet.height) {
            // header
            let row = document.createElement('tr');
            let cell = document.createElement('th');
            let v = ',' + String(this.height + 1); // cell ids are h,v coordinates
            cell.id = '0' + v;
            cell.innerText = String(this.height + 1);
            this.rowHeaders.push(cell); 
            row.appendChild(cell);

            // remainder, note different logic from above
            localRowCopy = [];
            for (let i = 0; i < this.width; i++) {
                cell = document.createElement('td');
                cell.id = String(i + 1) + v;
                localRowCopy.push(cell);
                row.appendChild(cell);
            }
            this.cells.push(localRowCopy);
            tbody.appendChild(row);

            tableHeight = tbody.clientHeight
            this.height++
        }
    }

    this.paint(true);
};


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


View.prototype.paint = function(forcePaint = false) {
    // const cell = this.cells[this.sheet.selected.y][this.sheet.selected.x];
    const x = this.sheet.selected.x + 1;
    const y = this.sheet.selected.y + 1;
    let redraw = false;

    // redo header
    if (forcePaint || x < this.h || x > this.h + this.width - 2 ) { // minus two because cells are one-indexed and width includes first cell
        firstH = Math.min(x, Math.max(this.h, x - this.width + 1, 1));
        this.columnHeaders.forEach((el, i) => {
            el.innerText = getLetterCode(firstH + i);
            el.id = String(i) + ',0';
        });
        this.h = firstH;
        redraw = true;
    }
    if (forcePaint || y < this.v || y > this.v + this.height - 2) { // minus two because cells are one-indexed and height includes first cell
        firstV = Math.min(y, Math.max(this.v, y - this.height + 1, 1));
        this.rowHeaders.forEach((el, i) => {
            el.innerText = String(firstV + i);
            el.id = '0,' + String(i);
        });
        this.v = firstV;
        redraw = true;
    }
    if (redraw)
        this.cells.forEach((row, v) => {
            row.forEach((cell, h) => {
                cell.id = String(h + firstH) + ',' + String(v + this.v);
                val = this.sheet.cells[firstV + v - 1][this.h + h - 1];
                if (val == 'X') {
                    cell.classList.add('goal');
                    cell.innerText = val;
                }
                else {
                    cell.classList.remove('goal');
                    if (this.color) {
                        let idx = CHARS.indexOf(val);
                        cell.bgColor = COLORS[idx];
                        cell.innerText = val === ' ' ? ' ' : this.fullChar;
                    }
                    else
                        cell.innerText = val;
                }
            });
        });

    const cell = this.cells[y - this.v][x - this.h];
    if (cell === this.selected)
        return;

    if (this.selected)
        this.selected.classList.remove('selected');
    if (this.rowLabel)
        this.rowLabel.classList.remove('selected');
    if (this.columnLabel)
        this.columnLabel.classList.remove('selected');
    
    cell.classList.add('selected');
    this.selected = cell;
    this.rowLabel = this.rowHeaders[y - this.v];
    this.columnLabel = this.columnHeaders[x - this.h];
    this.rowLabel.classList.add('selected');
    this.columnLabel.classList.add('selected');



    // scrollSelection(cell, this.tblContainer, this.rowLabels, this.colLabels);

    // function scrollSelection(cell, container, rowLabels, colLabels) {
    //     const parts = cell.id.split(",");
    //     const h = parseInt(parts[0]);
    //     const v = parseInt(parts[1]);

    //     if (v === 0)
    //         container.scrollTop = 0;
    //     else {
    //         const labelHeight = colLabels[0].clientHeight;
    //         if (container.scrollTop > cell.offsetTop - labelHeight)
    //             container.scrollTop = cell.offsetTop - labelHeight;
    //         else if (container.scrollTop + container.clientHeight < cell.offsetTop + cell.clientHeight)
    //             container.scrollTop = cell.offsetTop + cell.clientHeight - container.clientHeight;
    //     }

    //     if (h === 0)
    //         container.scrollLeft = 0;
    //     else {
    //         const labelWidth = rowLabels[0].clientWidth;
    //         if (container.scrollLeft > cell.offsetLeft - labelWidth)
    //             container.scrollLeft = cell.offsetLeft - labelWidth;
    //         else if (container.scrollLeft + container.clientWidth < cell.offsetLeft + cell.clientWidth)
    //             container.scrollLeft = cell.offsetLeft + cell.clientWidth - container.clientWidth;        
    //     }
    // }

};


View.prototype.translateTarget = function(target) {
    const coords = target.id.split(',');
    return new Point(parseInt(coords[0]) - 1, parseInt(coords[1]) - 1);
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
    this.selected.innerText = this.displayChars ? str : this.fullChar;
    if (str == 'X')
        this.selected.classList.add('goal');
    else 
        this.selected.classList.remove('goal');
    if (this.color) {
        let idx = CHARS.indexOf(str);
        this.selected.bgColor = COLORS[idx];
    }
};


View.prototype.tearDown = function() {
    this.h = 0;
    this.v = 0;
    this.width = 0;
    this.height = 0;
    while (this.tbl.childNodes.length > 0)
        this.tbl.removeChild(this.tbl.childNodes[0]);
    this.selected = null;
    this.cells = [];
    this.rowHeaders = [];
    this.columnHeaders = [];
};

function Point(x, y) {
    this.x = x;
    this.y = y;
}


function View(sheet, tblContainer) {
    this.cells = null;
    this.selected = null;
    this.rowLabels = null;
    this.colLabels = null;
    this.corner = null;

    this.tblContainer = tblContainer;
    this.tbl = tblContainer.children[0];
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
            cellEl.innerText = this.sheet.cells[v][h];
            if (cellEl.innerText == 'X')
                cellEl.classList.add('goal');
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
    let cell = this.cells[this.sheet.selected.y][this.sheet.selected.x];
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
    coordinates = cell.id.split(',');
    const x = parseInt(coordinates[0]);
    const y = parseInt(coordinates[1]);
    this.rowLabels[y].classList.add('selected')
    this.colLabels[x].classList.add('selected')
    scrollSelection(cell, this.tblContainer, this.rowLabels, this.colLabels);

    function scrollSelection(cell, container, rowLabels, colLabels) {
        labelHeight = colLabels[0].clientHeight;
        if (container.scrollTop > cell.offsetTop - labelHeight)
            container.scrollTop = cell.offsetTop - labelHeight;
        else if (container.scrollTop + container.clientHeight < cell.offsetTop + cell.clientHeight)
            container.scrollTop = cell.offsetTop + cell.clientHeight - container.clientHeight;
        
        labelWidth = rowLabels[0].clientWidth;
        if (container.scrollLeft > cell.offsetLeft - labelWidth)
            container.scrollLeft = cell.offsetLeft - labelWidth;
        else if (container.scrollLeft + container.clientWidth < cell.offsetLeft + cell.clientWidth)
            container.scrollLeft = cell.offsetLeft + cell.clientWidth - container.clientWidth;
    }
};


View.prototype.translateTarget = function(target) {
    coords = target.id.split(',');
    return new Point(parseInt(coords[0]), parseInt(coords[1]));
};


View.prototype.updateCellValue = function(str) {
    this.selected.innerText = str;
};


View.prototype.tearDown = function() {
    while (this.tbl.childNodes.length > 0)
        this.tbl.removeChild(this.tbl.childNodes[0]);
};


class OCRTable {
    constructor (data, startIndex, displayRows, previewBounds, previewRgn, sliderRgn, keyboardRgn, urls, notifyChange) {
        this.data = data;
        this.displayRows = displayRows;
        this.startIndex = startIndex;
        this.endIndex = this.startIndex + this.displayRows;
        this.previewBounds = previewBounds;
        this.previewRgn = previewRgn;
        this.sliderRgn = sliderRgn;
        this.keyboardRgn = keyboardRgn;
        this.urls = urls;
        this.notifyChange = notifyChange;

        this.fields = ['TEXT'];
        this.beingEdited = false;
        this.finish = null;

        this.sanitize();

        this.element = document.createElement('table');
        this.element.id = "table";

        this.head = new TableHead(this.fields);
        this.element.append(this.head.element);

        this.head.addField("LOCATION");
        this.fields.forEach((field) => this.head.addField(field));

        this.head.setPrevButton(() => this.stepsBackward(this.displayRows));
        this.head.setNextButton(() => this.stepsForward(this.displayRows));

        this.body = new TableBody();
        this.element.append(this.body.element);

        let prevRow = null;

        for (let nRow = this.startIndex; nRow < this.endIndex; ++nRow) {
            let row = new TableRow(this, nRow, prevRow);

            if (prevRow != null) {
                prevRow.nextRow = row;
            }
        
            row.setOnFocusIn(() => {
                updatePreview(row.data, this.urls, this.previewBounds);

                this.previewRgn.style.transform = 'translate(0,'
                    + (row.element.offsetTop + row.element.clientHeight/2) + 'px) translate(0%,-50%)'
            });

            row.addItem('LOCATION', new TableItem(nRow.toString(), 'LOCATION', row, false));

            // TODO: Set background color depending on confidence value (if available)
            let tokenItem = new TableItem(row.data['TEXT'], 'TEXT', row, true);
            row.addItem('TEXT', tokenItem);

            let tokenItemSelect = function () {
                if (this.parentRow.parentTable.beingEdited) return;

                this.parentRow.parentTable.beingEdited = true;

                this.clear();
                this.setClass("hover");

                let textArea = document.createElement('textarea');
                textArea.style.width = this.element.clientWidth + 'px';
                textArea.style.height = this.element.clientHeight + 'px';
                textArea.className = "input";
                textArea.value = this.data;

                this.append(textArea);
                textArea.focus();

                let buttons = document.createElement('div');

                let ok_btn = document.createElement('button');
                ok_btn.className = "btn btn-secondary btn-sm";
                ok_btn.innerText = "OK";
                buttons.append(ok_btn);
                buttons.append(" ");

                let cancel_btn = document.createElement('button');
                cancel_btn.className = "btn btn-secondary btn-sm";
                cancel_btn.innerText = "CANCEL";
                buttons.append(cancel_btn);

                this.append(buttons);

                this.parentRow.parentTable.finish = (isOk) => {
                    this.setClass("editable hover");
                    keyboard.listener.reset();
                    listener.reset();

                    if (isOk) {
                        let data = textArea.value;
                        this.parentRow.parentTable.data[this.parentRow.nRow][this.field] = data
                    }

                    this.parentRow.parentTable.sanitize();
                    this.parentRow.parentTable.notifyChange();
                    this.parentRow.parentTable.update();

                    this.parentRow.parentTable.beingEdited = false;

                    keyboard.clear();

                    this.focus()
                };

                let keyboard = new Keyboard(
                    this.parentRow.parentTable.keyboardRgn,
                    textArea,
                    this.parentRow.parentTable.finish
                );

                let listener = new window.keypress.Listener(textArea, {prevent_repeat: true});

                listener.simple_combo('enter', () => this.parentRow.parentTable.finish(true));
                listener.simple_combo('esc', () => this.parentRow.parentTable.finish(false));
                listener.simple_combo('ctrl', keyboard.toggleLayout.bind(keyboard));

                ok_btn.onclick = (evt) => {
                    evt.stopPropagation();
                    this.parentRow.parentTable.finish(true)
                };
                cancel_btn.onclick = (evt) => {
                    evt.stopPropagation();
                    this.parentRow.parentTable.finish(false)
                };
            };

            tokenItem.setOnClick(tokenItemSelect.bind(tokenItem));
            tokenItem.setSimpleCombo('enter', tokenItemSelect.bind(tokenItem));

            Object.entries(row.items).forEach(([field, item]) => {
                item.setOnMouseOver((event) => {
                    if (!this.beingEdited) {
                        event.target.focus()
                    }
                });
                item.fill()
            });

            this.body.addRow(row);
            prevRow = row
        }

        if (this.sliderRgn.value != this.startIndex) {
            this.sliderRgn.value = this.data.length - this.startIndex
        }
    }

    stepsBackward(nrows) {
        if (this.beingEdited) return;

        if (this.startIndex >= nrows) {
            this.startIndex -= nrows;
            this.endIndex -= nrows
        }
        else {
            this.startIndex = 0;
            this.endIndex = this.displayRows
        }

        this.update()
    }

    stepsForward(nrows) {
        if (this.beingEdited) return;

        if (this.endIndex + nrows < this.data.length) {
            this.endIndex += nrows;
            this.startIndex = this.endIndex - this.displayRows
        }
        else {
            this.endIndex = this.data.length;
            this.startIndex = this.endIndex - this.displayRows
        }

        this.update()
    }

    sanitize() {
        let word_pos = 1;

        this.data.forEach((row) => {
            this.previewBounds.minLeft = (parseInt(row['left']) < this.previewBounds.minLeft) ?
                parseInt(row['left']) : this.previewBounds.minLeft;

            this.previewBounds.maxRight = (parseInt(row['right']) > this.previewBounds.maxRight) ?
                parseInt(row['right']) : this.previewBounds.maxRight;

            this.previewBounds.minTop = (parseInt(row['top']) < this.previewBounds.minTop) ?
                parseInt(row['top']) : this.previewBounds.minTop;

            this.previewBounds.maxBottom = (parseInt(row['bottom']) > this.previewBounds.maxBottom) ?
                parseInt(row['bottom']) : this.previewBounds.maxBottom;

            Object.keys(row).forEach((col) => {
                if (row[col] == null) {
                    row[col] = "";
                }
                if (row[col] === "") {
                    word_pos = 0
                }
                row[col] = row[col].toString().replace(/(\r\n|\n|\r)/gm, "")
            });

            row['No.'] = word_pos;

            word_pos++
        })
    }

    update() {
        this.beingEdited = false;

        let pRow = 0;

        for (let nRow = this.startIndex; nRow < this.endIndex; ++nRow) {
            let row = this.body.rows[pRow];
            row.data = this.data[nRow];

            Object.entries(row.items).forEach(([field, item]) => {
                if (field === 'LOCATION') {
                    item.data = nRow.toString()
                }
                else {
                    item.data = row.data[field]
                }
                item.fill()
            });

            pRow++
        }

        if (this.sliderRgn.value != this.startIndex) {
            this.sliderRgn.value = this.data.length - this.startIndex
        }

        this.body.rows.forEach((row) => {
            if (row.hasFocusIn()) {
                updatePreview(row.data, this.urls, this.previewBounds)
            }
        })
    }
}
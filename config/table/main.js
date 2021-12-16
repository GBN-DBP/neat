class TableHead {
    constructor (fields) {
        this.fields = fields;

        this.element = document.createElement('thead');

        this.tr = document.createElement('tr');
        this.element.append(this.tr);

        this.fields = []
    }

    addField(field) {
        this.fields.push(field);

        let th = document.createElement('th');
        th.style = "width: 15%";

        let d_flex = document.createElement('div');
        d_flex.className = "d-flex align-items-center";

        let flex_grow = document.createElement('div');
        flex_grow.className = "flex-grow-1";
        flex_grow.innerText = field;

        d_flex.append(flex_grow);
        th.append(d_flex);
        this.tr.append(th)
    }

    setPrevButton(callback) {
        let btn = document.createElement('button');
        btn.className = "btn btn-link float-left align-middle"
        btn.tabIndex = "-1";
        btn.innerText = "<<";

        this.tr.firstChild.firstChild.prepend(btn);

        btn.onclick = callback
    }

    setNextButton(callback) {
        let btn = document.createElement('button');
        btn.className = "btn btn-link float-right align-middle"
        btn.tabIndex = "-1";
        btn.innerText = ">>";

        this.tr.lastChild.lastChild.append(btn);

        btn.onclick = callback
    }
}

class TableItem {
    constructor (data, field, parentRow, isEditable) {
        this.data = data;
        this.field = field;
        this.parentRow = parentRow;
        this.isEditable = isEditable;

        this.fontFamily = "AletheiaSans";
        this.fontSize = 12;
        this.bold = false;
        this.italic = false;
        this.letterspaced = false;

        this.element = document.createElement('td');
        this.element.className = this.isEditable ? "editable hover" : "hover";
        this.element.innerText = this.data;
        if (this.isEditable) this.element.tabIndex = "0";

        this.listener = new window.keypress.Listener(this.element, { prevent_repeat: true })
    }

    setFontFamily(family) {
        this.fontFamily = family
    }

    setFontSize(size) {
        this.fontSize = size
    }

    toggleBold() {
        this.bold = !this.bold
    }

    toggleItalic() {
        this.italic = !this.italic
    }

    toggleLetterspaced() {
        this.letterspaced = !this.letterspaced
    }

    toggleEditable() {
        this.isEditable = !this.isEditable
    }

    fill() {
        this.clear();

        let elm = this.element;

        if (this.bold) {
            let bold = document.createElement('b');
            elm.append(bold);
            elm = bold
        }

        if (this.italic) {
            let italic = document.createElement('i');
            elm.append(italic);
            elm = italic
        }

        if (this.letterspaced) {
            let letterspaced = document.createElement('span');
            letterspaced.style = "letter-spacing:0.3em;font-family:" + this.fontFamily + ";font-size:" + this.fontSize.toString() + "pt";
            elm.append(letterspaced);
            elm = letterspaced
        }
        else {
            elm.style = "font-family:" + this.fontFamily + ";font-size:" + this.fontSize.toString() + "pt"
        }

        // this.setStyle("font-family:" + this.fontFamily + ";font-size:" + this.fontSize.toString() + "pt");
        // this.setText(this.data)

        elm.innerText = this.data
    }

    setText(text) {
        this.element.innerText = text
    }

    setHTML(html) {
        this.element.innerHTML = html
    }

    setStyle(style) {
        this.element.style = style
    }

    setClass(className) {
        this.element.className = className
    }

    setOnClick(callback) {
        this.element.onclick = callback
    }

    setOnMouseOver(callback) {
        this.element.onmouseover = callback
    }

    append(elm) {
        this.element.append(elm)
    }

    focus() {
        this.element.focus()
    }

    hasFocus() {
        return this.element == document.activeElement
    }

    clear() {
        this.element.innerHTML = ''
    }

    setSimpleCombo(key, action) {
        this.listener.sequence_combo(key, action)
    }

    setSequenceCombo(keys, action) {
        this.listener.sequence_combo(keys, action)
    }
}

class TableRow {
    constructor (parentTable, nRow, prevRow) {
        this.parentTable = parentTable;
        this.nRow = nRow;
        this.prevRow = prevRow;
        this.nextRow = null;
        this.data = this.parentTable.data[this.nRow];

        this.element = document.createElement('tr');

        this.items = {};

        this.listener = new window.keypress.Listener(this.element, { prevent_repeat: true })
    }

    addItem(field, item) {
        this.items[field] = item;
        this.element.append(item.element)
    }

    setOnFocusIn(callback) {
        this.element.onfocusin = callback
    }

    setOnFocusOut(callback) {
        this.element.onfocusout = callback
    }

    hasFocusIn() {
        return Object.keys(this.items).some((field) => this.items[field].hasFocus())
    }

    setSequenceCombo(keys, action) {
        this.listener.sequence_combo(keys, action)
    }
}

class TableBody {
    constructor () {
        this.element = document.createElement('tbody');
        this.element.id = "table-body";

        this.rows = []
    }

    addRow(row) {
        this.rows.push(row);
        this.element.append(row.element)
    }
}

class NERTable {
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

        this.fields = ['No.', 'TOKEN', 'NE-TAG', 'NE-EMB', 'ID'];
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

            let sentenceAction = function () {
                if (this.parentTable.beingEdited) return;

                let new_line = JSON.parse(JSON.stringify(this.data));

                new_line['TOKEN'] = "";
                new_line['NE-TAG'] = 'O';
                new_line['NE-EMB'] = 'O';
                new_line['ID'] = "";

                this.parentTable.data.splice(this.nRow, 0, new_line);

                this.parentTable.sanitize();
                this.parentTable.notifyChange();
                this.parentTable.update()
            };

            let splitAction = function () {
                if (this.parentTable.beingEdited) return;

                this.parentTable.data.splice(this.nRow, 0, JSON.parse(JSON.stringify(this.data)));

                this.parentTable.sanitize();
                this.parentTable.notifyChange();
                this.parentTable.update()
            };

            let mergeAction = function () {
                if (this.parentTable.beingEdited) return;
                if (this.prevRow == null) return;

                this.prevRow.data['TOKEN'] = this.prevRow.data['TOKEN'].toString() + this.data['TOKEN'].toString();

                this.parentTable.data.splice(this.nRow, 1);

                this.parentTable.sanitize();
                this.parentTable.notifyChange();
                this.parentTable.update()
            };

            let deleteAction = function () {
                if (this.parentTable.beingEdited) return;

                this.parentTable.data.splice(this.nRow, 1);

                this.parentTable.sanitize();
                this.parentTable.notifyChange();
                this.parentTable.update()
            };

            let rowCombos = {
                's t': sentenceAction,
                's p': splitAction,
                'm e': mergeAction,
                'd l': deleteAction
            };

            Object.entries(rowCombos).forEach(([combo, action]) => {
                row.setSequenceCombo(combo, (evt) => {
                    evt.stopPropagation();
                    action.bind(row)()
                })
            });

            row.addItem('LOCATION', new TableItem(nRow.toString(), 'LOCATION', row, false));

            let noItem = new TableItem(row.data['No.'], 'No.', row, true);
            row.addItem('No.', noItem);

            let noItemSelect = function () {
                if (this.parentRow.parentTable.beingEdited) return;

                this.clear();
                this.setClass("hover");

                let tokenizer = document.createElement('div');
                tokenizer.className = "accordion";
                tokenizer.id = "tokenizer";
                tokenizer.style = "display:block;";

                let rowActionTexts = {
                    'sentence': '\u2607\u00a0sentence',
                    'split': '\u2195\u00a0split',
                    'merge': '\u27f3\u00a0merge',
                    'delete': '\u24e7\u00a0delete'
                };

                Object.entries(rowActionTexts).forEach(([id, text]) => {
                    let section = document.createElement('section');
                    section.className = "accordion-item tokenizer-action";
                    section.id = id;
                    section.textContent = text;

                    tokenizer.append(section)
                });

                this.append(tokenizer);

                let rowActions = {
                    'sentence': sentenceAction,
                    'split': splitAction,
                    'merge': mergeAction,
                    'delete': deleteAction
                };

                this.parentRow.parentTable.finish = (isOk, evt = null) => {
                    this.setClass("editable hover");
                    this.fill();

                    if (isOk) {
                        let action = evt.target.id;
                        if (action in rowActions) {
                            rowActions[action].bind(this.parentRow)()
                        }
                    }

                    this.focus()
                };

                Array.from(tokenizer.childNodes).forEach((section) => {
                    section.onclick = (evt) => {
                        evt.stopPropagation();
                        this.parentRow.parentTable.finish(true, evt)
                    };
                });

                tokenizer.onmouseleave = () => this.parentRow.parentTable.finish(false)
            };

            noItem.setOnClick(noItemSelect.bind(noItem));

            // TODO: Set background color depending on confidence value (if available)
            let tokenItem = new TableItem(row.data['TOKEN'], 'TOKEN', row, true);
            row.addItem('TOKEN', tokenItem);

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

            let tagAction = function (tag) {
                this.parentRow.parentTable.data[this.parentRow.nRow][this.field] = tag;
                this.parentRow.parentTable.sanitize();
                this.parentRow.parentTable.notifyChange();
                this.parentRow.parentTable.update()
            };

            let neTagItem = new TableItem(row.data['NE-TAG'], 'NE-TAG', row, true);
            row.addItem('NE-TAG', neTagItem);

            let neTagItemFill = function () {
                let bTagClasses = {
                    'B-PER': 'ner_per',
                    'B-LOC': 'ner_loc',
                    'B-ORG': 'ner_org',
                    'B-WORK': 'ner_work',
                    'B-CONF': 'ner_conf',
                    'B-EVT': 'ner_evt',
                    'B-TODO': 'ner_todo'
                };

                let iTagClasses = {
                    'I-PER': 'ner_per',
                    'I-LOC': 'ner_loc',
                    'I-ORG': 'ner_org',
                    'I-WORK': 'ner_work',
                    'I-CONF': 'ner_conf',
                    'I-EVT': 'ner_evt',
                    'I-TODO': 'ner_todo'
                };

                this.clear();
                this.setText(this.data);

                if (this.data.includes("B-")) {
                    let myClass = bTagClasses[this.data];
                    this.setClass(this.isEditable ? "editable hover " + myClass : "hover " + myClass)
                }
                else if (this.data.includes("I-")) {
                    let myClass = iTagClasses[this.data]
                    this.setClass(this.isEditable ? "editable hover " + myClass : "hover " + myClass)
                }
                else {
                    this.setClass(this.isEditable ? "editable hover" : "hover")
                }
            };

            let neTagItemSelect = function () {
                if (this.parentRow.parentTable.beingEdited) return;

                this.parentRow.parentTable.beingEdited = true;

                let tags = [
                    'B-PER',
                    'B-LOC',
                    'B-ORG',
                    'B-WORK',
                    'B-CONF',
                    'B-EVT',
                    'B-TODO',
                    'I-PER',
                    'I-LOC',
                    'I-ORG',
                    'I-WORK',
                    'I-CONF',
                    'I-EVT',
                    'I-TODO'
                ];

                let bTagClasses = {
                    'B-PER': 'ner_per',
                    'B-LOC': 'ner_loc',
                    'B-ORG': 'ner_org',
                    'B-WORK': 'ner_work',
                    'B-CONF': 'ner_conf',
                    'B-EVT': 'ner_evt',
                    'B-TODO': 'ner_todo'
                };

                let iTagClasses = {
                    'I-PER': 'ner_per',
                    'I-LOC': 'ner_loc',
                    'I-ORG': 'ner_org',
                    'I-WORK': 'ner_work',
                    'I-CONF': 'ner_conf',
                    'I-EVT': 'ner_evt',
                    'I-TODO': 'ner_todo'
                };

                this.clear();
                this.setClass("hover");

                let tagger = document.createElement('div');
                tagger.className = "accordion";
                tagger.style = "display:block;";

                let o_section = document.createElement('section');
                o_section.className = "accordion-item type_select";
                o_section.innerText = "O";

                tagger.append(o_section);

                let b_section = document.createElement('section');
                b_section.className = "accordion-item";
                b_section.innerText = "B";

                tagger.append(b_section);

                let b_section_content = document.createElement('div');
                b_section_content.className = "accordion-item-content";

                b_section.append(b_section_content);

                Object.entries(bTagClasses).forEach(([tag, className]) => {
                    let elm = document.createElement('div');
                    elm.className = className + " type_select";
                    elm.innerText = tag;

                    b_section_content.append(elm)
                });

                let i_section = document.createElement('section');
                i_section.className = "accordion-item";
                i_section.innerText = "I";

                tagger.append(i_section);

                let i_section_content = document.createElement('div');
                i_section_content.className = "accordion-item-content";

                i_section.append(i_section_content);

                Object.entries(iTagClasses).forEach(([tag, className]) => {
                    let elm = document.createElement('div');
                    elm.className = className + " type_select";
                    elm.innerText = tag;

                    i_section_content.append(elm)
                });

                this.append(tagger);

                this.parentRow.parentTable.finish = (isOk, tag = null) => {
                    this.setClass("editable hover");

                    if (isOk && tags.includes(tag)) {
                        tagAction.bind(this)(tag)
                    }

                    this.fill();
                    this.focus();

                    this.parentRow.parentTable.beingEdited = false
                };

                o_section.onclick = (evt) => this.parentRow.parentTable.finish(true, 'O');

                Array.from(b_section_content.childNodes).forEach((elm) => {
                    elm.onclick = (evt) => this.parentRow.parentTable.finish(true, evt.target.textContent.trim())
                });

                Array.from(i_section_content.childNodes).forEach((elm) => {
                    elm.onclick = (evt) => this.parentRow.parentTable.finish(true, evt.target.textContent.trim())
                });

                tagger.onmouseleave = (() => this.parentRow.parentTable.finish(false))
            };

            neTagItem.fill = neTagItemFill.bind(neTagItem);
            neTagItem.setOnClick(neTagItemSelect.bind(neTagItem));

            let tagCombos = {
                'B-PER': 'b p',
                'I-PER': 'i p',
                'B-LOC': 'b l',
                'I-LOC': 'i l',
                'B-ORG': 'b o',
                'I-ORG': 'i o',
                'B-WORK': 'b w',
                'I-WORK': 'i w',
                'B-CONF': 'b c',
                'I-CONF': 'i c',
                'B-EVT': 'b e',
                'I-EVT': 'i e',
                'B-TODO': 'b t',
                'I-TODO': 'i t'
            };

            Object.entries(tagCombos).forEach(([tag, combo]) => {
                neTagItem.setSequenceCombo(combo, () => tagAction.bind(neTagItem)(tag))
            });
            neTagItem.setSimpleCombo('backspace', () => tagAction.bind(neTagItem)('O'));

            let neEmbItem = new TableItem(row.data['NE-EMB'], 'NE-EMB', row, true);
            row.addItem('NE-EMB', neEmbItem);

            let neEmbItemSelect = neTagItemSelect;
            let neEmbItemFill = neTagItemFill;

            neEmbItem.fill = neEmbItemFill.bind(neEmbItem);
            neEmbItem.setOnClick(neEmbItemSelect.bind(neEmbItem));

            Object.entries(tagCombos).forEach(([tag, combo]) => {
                neEmbItem.setSequenceCombo(combo, () => tagAction.bind(neEmbItem)(tag))
            });
            neEmbItem.setSimpleCombo('backspace', () => tagAction.bind(neEmbItem)('O'));

            let idItem = new TableItem(row.data['ID'], 'ID', row, true);
            row.addItem('ID', idItem);

            let idItemFill = function () {
                this.clear();
                if (String(this.data).match(/^Q[0-9]+.*/g) == null) {
                    this.setText(this.data)
                }
                else {
                    this.clear();

                    let regex = /.*?(Q[0-9]+).*?/g;
                    for (let i = 0; i <= 2; ++i) {
                        let match = regex.exec(this.data);
                        if (match === null) {
                            break
                        }

                        let url = "https://www.wikidata.org/wiki/" + match[1];
                        let text = match[1];

                        let link = document.createElement('a');
                        link.innerText = text;
                        link.href = url;
                        link.onclick = (event) => event.stopPropagation();

                        this.element.append(link);
                        this.element.append(document.createElement('br'))
                    }
                }
            };

            let idItemSelect = tokenItemSelect;

            idItem.fill = idItemFill.bind(idItem);
            idItem.setOnClick(idItemSelect.bind(idItem));
            idItem.setSimpleCombo('enter', idItemSelect.bind(idItem));

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

class FontsTable {
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

        this.fields = ['TOKEN', 'LANG', 'FONT-FAMILY', 'FONT-SIZE', 'BOLD', 'ITALIC', 'LETTERSPACED'];
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
                // TODO: better way of doing this
                if (!this.beingEdited && row.data['FONT-SIZE'] !== "") {
                    let scale_factor = 2.0;
                    let font_size = parseFloat(row.data['FONT-SIZE']) * scale_factor;
                    row.items['TOKEN'].setFontSize(font_size);
                    row.items['TOKEN'].fill()
                }

                updatePreview(row.data, this.urls, this.previewBounds);

                this.previewRgn.style.transform = 'translate(0,'
                    + (row.element.offsetTop + row.element.clientHeight/2) + 'px) translate(0%,-50%)'
            });

            row.setOnFocusOut(() => {
                if (!this.beingEdited) {
                    row.items['TOKEN'].setFontSize(15);
                    row.items['TOKEN'].fill()
                }
            });

            row.addItem('LOCATION', new TableItem(nRow.toString(), 'LOCATION', row, false));

            // TODO: Set background color depending on confidence value (if available)
            let tokenItem = new TableItem(row.data['TOKEN'], 'TOKEN', row, true);
            row.addItem('TOKEN', tokenItem);

            if (row.data['FONT-FAMILY'] === 'Fraktur') {
                tokenItem.fontFamily = "UnifrakturMaguntia";
                tokenItem.fontSize = 15
            }
            else {
                tokenItem.fontFamily = "AletheiaSans";
                tokenItem.fontSize = 12
            }

            if (row.data['BOLD'] == 'True') {
                tokenItem.bold = true
            }

            if (row.data['ITALIC'] == 'True') {
                tokenItem.italic = true
            }

            if (row.data['LETTERSPACED'] == 'True') {
                tokenItem.letterspaced = true
            }

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

            let tagAction = function (tag) {
                this.parentRow.parentTable.data[this.parentRow.nRow][this.field] = tag;
                this.parentRow.parentTable.sanitize();
                this.parentRow.parentTable.notifyChange();
                this.parentRow.parentTable.update()
            };

            let langItem = new TableItem(row.data['LANG'], 'LANG', row, true);
            row.addItem('LANG', langItem);

            let langItemSelect = function () {
                if (this.parentRow.parentTable.beingEdited) return;

                this.clear();
                this.setClass("hover");

                let tagger = document.createElement('div');
                tagger.className = "accordion";
                tagger.style = "display:block;";

                let tags = [
                    'German',
                    'Portuguese',
                    'English'
                ];

                tags.forEach((tag) => {
                    let section = document.createElement('section');
                    section.className = "accordion-item type_select";
                    section.textContent = tag;

                    tagger.append(section)
                });

                this.append(tagger);

                this.parentRow.parentTable.finish = (isOk, tag = null) => {
                    this.setClass("editable hover");

                    if (isOk && tags.includes(tag)) {
                        tagAction.bind(this)(tag)
                    }

                    this.fill();
                    this.focus();

                    this.parentRow.parentTable.beingEdited = false
                };

                Array.from(tagger.childNodes).forEach((section) => {
                    section.onclick = (evt) => {
                        evt.stopPropagation();
                        this.parentRow.parentTable.finish(true, section.textContent, evt)
                    };
                });

                tagger.onmouseleave = () => this.parentRow.parentTable.finish(false)
            };

            langItem.setOnClick(langItemSelect.bind(langItem));

            let familyItem = new TableItem(row.data['FONT-FAMILY'], 'FONT-FAMILY', row, true);
            row.addItem('FONT-FAMILY', familyItem);

            let familyItemSelect = function () {
                if (this.parentRow.parentTable.beingEdited) return;

                this.clear();
                this.setClass("hover");

                let tagger = document.createElement('div');
                tagger.className = "accordion";
                tagger.style = "display:block;";

                let tags = [
                    'Antiqua',
                    'Fraktur',
                    'Textur'
                ];

                tags.forEach((tag) => {
                    let section = document.createElement('section');
                    section.className = "accordion-item type_select";
                    section.textContent = tag;

                    tagger.append(section)
                });

                this.append(tagger);

                this.parentRow.parentTable.finish = (isOk, tag = null) => {
                    this.setClass("editable hover");

                    if (isOk && tags.includes(tag)) {
                        tagAction.bind(this)(tag)
                    }

                    this.fill();
                    this.focus();

                    this.parentRow.parentTable.beingEdited = false
                };

                Array.from(tagger.childNodes).forEach((section) => {
                    section.onclick = (evt) => {
                        evt.stopPropagation();
                        this.parentRow.parentTable.finish(true, section.textContent, evt)
                    };
                });

                tagger.onmouseleave = () => this.parentRow.parentTable.finish(false)
            };

            familyItem.setOnClick(familyItemSelect.bind(familyItem));

            let sizeItem = new TableItem(row.data['FONT-SIZE'], 'FONT-SIZE', row, true);
            row.addItem('FONT-SIZE', sizeItem);

            let sizeItemSelect = function () {
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

            sizeItem.setOnClick(sizeItemSelect.bind(sizeItem));
            sizeItem.setSimpleCombo('enter', sizeItemSelect.bind(sizeItem));

            let boldItem = new TableItem(row.data['BOLD'], 'BOLD', row, true);
            row.addItem('BOLD', boldItem);

            let boldItemSelect = function () {
                if (this.parentRow.parentTable.beingEdited) return;

                this.parentRow.items['TOKEN'].toggleBold();
                if (this.parentRow.items['TOKEN'].bold) {
                    this.parentRow.parentTable.data[this.parentRow.nRow]['BOLD'] = 'True'
                } else {
                    this.parentRow.parentTable.data[this.parentRow.nRow]['BOLD'] = 'False'
                }

                this.parentRow.parentTable.update()
            };

            boldItem.setOnClick(boldItemSelect.bind(boldItem));
            boldItem.setSimpleCombo('enter', boldItemSelect.bind(boldItem));

            let italicItem = new TableItem(row.data['ITALIC'], 'ITALIC', row, true);
            row.addItem('ITALIC', italicItem);

            let italicItemSelect = function () {
                if (this.parentRow.parentTable.beingEdited) return;

                this.parentRow.items['TOKEN'].toggleItalic();
                if (this.parentRow.items['TOKEN'].italic) {
                    this.parentRow.parentTable.data[this.parentRow.nRow]['ITALIC'] = 'True'
                } else {
                    this.parentRow.parentTable.data[this.parentRow.nRow]['ITALIC'] = 'False'
                }

                this.parentRow.parentTable.update()
            };

            italicItem.setOnClick(italicItemSelect.bind(italicItem));
            italicItem.setSimpleCombo('enter', italicItemSelect.bind(italicItem));

            let letterspacedItem = new TableItem(row.data['LETTERSPACED'], 'LETTERSPACED', row, true);
            row.addItem('LETTERSPACED', letterspacedItem);

            let letterspacedItemSelect = function () {
                if (this.parentRow.parentTable.beingEdited) return;

                this.parentRow.items['TOKEN'].toggleLetterspaced();
                if (this.parentRow.items['TOKEN'].letterspaced) {
                    this.parentRow.parentTable.data[this.parentRow.nRow]['LETTERSPACED'] = 'True'
                } else {
                    this.parentRow.parentTable.data[this.parentRow.nRow]['LETTERSPACED'] = 'False'
                }

                this.parentRow.parentTable.update()
            };

            letterspacedItem.setOnClick(letterspacedItemSelect.bind(letterspacedItem));
            letterspacedItem.setSimpleCombo('enter', letterspacedItemSelect.bind(letterspacedItem));

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
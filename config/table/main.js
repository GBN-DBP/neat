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

        this.element = document.createElement('td');
        this.element.className = this.isEditable ? "editable hover" : "hover";
        this.element.innerText = this.data;
        this.element.tabIndex = "0";

        this.listener = new window.keypress.Listener(this.element, { prevent_repeat: true })
    }

    toggleEditable() {
        this.isEditable = !this.isEditable
    }

    setFill(method) {
        this.fill = method
    }

    setText(text) {
        this.element.innerText = text
    }

    setHTML(html) {
        this.element.innerHTML = html
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
    constructor (data, nRow, prevRow) {
        this.data = data;
        this.nRow = nRow;
        this.prevRow = prevRow;
        this.nextRow = null;

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

let table = {
    displayRows: 15,
    startIndex: 0,
    endIndex: 15,

    minLeft: 1000000000,
    maxRight: 0,
    minTop: 1000000000,
    maxBottom: 0,

    fields: ['No.', 'TOKEN', 'NE-TAG', 'NE-EMB', 'ID'],

    data: null,
    previewRgn: null,
    sliderRgn: null,
    keyboardRgn: null,
    urls: null,
    listener_defaults: null,
    notifyChange: null,

    beingEdited: false,
    finish: null,

    head: null,
    body: null,

    element: null,

    init: function (data, previewRgn, sliderRgn, keyboardRgn, urls, listener_defaults, notifyChange) {
        table.data = data.data;
        table.previewRgn = previewRgn;
        table.sliderRgn = sliderRgn;
        table.keyboardRgn = keyboardRgn;
        table.urls = urls;
        table.listener_defaults = listener_defaults;
        table.notifyChange = notifyChange;

        table.sanitize();

        table.element = document.createElement('table');
        table.element.id = "table";

        table.head = new TableHead(table.fields);
        table.element.append(table.head.element);

        table.head.addField("LOCATION");
        table.fields.forEach((field) => table.head.addField(field));

        table.head.setPrevButton(() => table.stepsBackward(table.displayRows));
        table.head.setNextButton(() => table.stepsForward(table.displayRows));

        table.body = new TableBody();
        table.element.append(table.body.element);

        let prevRow = null;

        for (let nRow = table.startIndex; nRow < table.endIndex; ++nRow) {
            let row = new TableRow(table.data[nRow], nRow, prevRow);

            if (prevRow != null) {
                prevRow.nextRow = row;
            }
        
            row.setOnFocusIn(() => {
                updatePreview(row.data, table.urls);

                table.previewRgn.style.transform = 'translate(0,'
                    + (row.element.offsetTop + row.element.clientHeight/2) + 'px) translate(0%,-50%)'
            });

            let rowSentenceAction = function () {
                if (table.beingEdited) return;

                let new_line = JSON.parse(JSON.stringify(this.data));

                new_line['TOKEN'] = "";
                new_line['NE-TAG'] = 'O';
                new_line['NE-EMB'] = 'O';
                new_line['ID'] = "";

                table.data.splice(this.nRow, 0, new_line);

                table.sanitize();
                table.notifyChange();
                table.update()
            };

            let rowSplitAction = function () {
                if (table.beingEdited) return;

                table.data.splice(nRow, 0, JSON.parse(JSON.stringify(this.data)));

                table.sanitize();
                table.notifyChange();
                table.update()
            };

            let rowMergeAction = function () {
                if (table.beingEdited) return;
                if (this.prevRow == null) return;

                this.prevRow.data['TOKEN'] = this.prevRow.data['TOKEN'].toString() + this.data['TOKEN'].toString();

                table.data.splice(this.nRow, 1);

                table.sanitize();
                table.notifyChange();
                table.update()
            };

            let rowDeleteAction = function () {
                if (table.beingEdited) return;

                table.data.splice(this.nRow, 1);

                table.sanitize();
                table.notifyChange();
                table.update()
            };

            let rowActions = {
                'sentence': rowSentenceAction,
                'split': rowSplitAction,
                'merge': rowMergeAction,
                'delete': rowDeleteAction
            };

            let rowActionTexts = {
                'sentence': '\u2607\u00a0sentence',
                'split': '\u2195\u00a0split',
                'merge': '\u27f3\u00a0merge',
                'delete': '\u24e7\u00a0delete'
            };

            let rowCombos = {
                's t': rowSentenceAction,
                's p': rowSplitAction,
                'm e': rowMergeAction,
                'd l': rowDeleteAction
            };

            Object.entries(rowCombos).forEach(([combo, action]) => {
                row.setSequenceCombo(combo, action.bind(row))
            });

            let locItemField = 'LOCATION';
            let locItemData = nRow.toString();
            let locItemFill = function () {
                this.clear();
                this.setText(this.data)
            };

            let locItem = new TableItem(locItemData, locItemField, row, false);

            locItem.setFill(locItemFill.bind(locItem));
            row.addItem(locItemField, locItem);

            let noItemField = 'No.';
            let noItemData = row.data[noItemField];
            let noItemSelect = function () {
                if (table.beingEdited) return;

                this.clear();
                this.setClass("hover");

                let tokenizer = document.createElement('div');
                tokenizer.className = "accordion";
                tokenizer.id = "tokenizer";
                tokenizer.style = "display:block;";

                Object.entries(rowActionTexts).forEach(([id, text]) => {
                    let section = document.createElement('section');
                    section.className = "accordion-item tokenizer-action";
                    section.id = id;
                    section.textContent = text;

                    tokenizer.append(section)
                });

                this.append(tokenizer);

                table.finish = (isOk, evt = null) => {
                    this.setClass("editable hover");
                    this.fill();

                    if (isOk) {
                        let action = evt.target.id;
                        if (action in rowActions) rowActions[action].bind(this.parentRow)()
                    }

                    this.focus()
                };

                Array.from(tokenizer.childNodes).forEach((section) => {
                    section.onclick = (evt) => {
                        evt.stopPropagation();
                        table.finish(true, evt)
                    };
                });

                tokenizer.onmouseleave = () => table.finish(false)
            };
            let noItemFill = function () {
                this.clear();
                this.setText(this.data)
            };

            let noItem = new TableItem(noItemData, noItemField, row, true);

            noItem.setOnClick(noItemSelect.bind(noItem));
            noItem.setFill(noItemFill.bind(noItem));
            row.addItem(noItemField, noItem);

            let tokenItemField = 'TOKEN';
            let tokenItemData = row.data[tokenItemField];
            let tokenItemSelect = function () {
                if (table.beingEdited) return;

                table.beingEdited = true;

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

                table.finish = (isOk) => {
                    this.setClass("editable hover");
                    keyboard.listener.reset();
                    listener.reset();

                    if (isOk) {
                        let data = textArea.value;
                        table.data[this.parentRow.nRow][this.field] = data
                    }

                    table.sanitize();
                    table.notifyChange();
                    table.update();

                    table.beingEdited = false;

                    keyboard.clear();

                    this.focus()
                };

                let keyboard = new Keyboard(table.keyboardRgn, textArea, table.finish);

                let listener = new window.keypress.Listener(textArea, {prevent_repeat: true});

                listener.simple_combo('enter', () => table.finish(true));
                listener.simple_combo('esc', () => table.finish(false));
                listener.simple_combo('ctrl', keyboard.toggleLayout.bind(keyboard));

                ok_btn.onclick = (evt) => {
                    evt.stopPropagation();
                    table.finish(true)
                };
                cancel_btn.onclick = (evt) => {
                    evt.stopPropagation();
                    table.finish(false)
                };
            };
            let tokenItemFill = function () {
                this.clear();
                this.setText(this.data)
            };

            // TODO: Set background color depending on confidence value (if available)
            let tokenItem = new TableItem(tokenItemData, tokenItemField, row, true);

            tokenItem.setOnClick(tokenItemSelect.bind(tokenItem));
            tokenItem.setFill(tokenItemFill.bind(tokenItem));
            tokenItem.setSimpleCombo('enter', tokenItemSelect.bind(tokenItem));
            row.addItem(tokenItemField, tokenItem);

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

            let tagAction = function (tag) {
                table.data[this.parentRow.nRow][this.field] = tag;
                table.sanitize();
                table.notifyChange();
                table.update()
            };

            let neTagItemField = 'NE-TAG';
            let neTagItemData = row.data[neTagItemField];
            let neTagItemSelect = function () {
                if (table.beingEdited) return;

                table.beingEdited = true;

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

                table.finish = (isOk, tag = null) => {
                    this.setClass("editable hover");

                    if (isOk && tags.includes(tag)) {
                        tagAction.bind(this)(tag)
                    }

                    this.fill();
                    this.focus();

                    table.beingEdited = false
                };

                o_section.onclick = (evt) => table.finish(true, 'O');

                Array.from(b_section_content.childNodes).forEach((elm) => {
                    elm.onclick = (evt) => table.finish(true, evt.target.textContent.trim())
                });

                Array.from(i_section_content.childNodes).forEach((elm) => {
                    elm.onclick = (evt) => table.finish(true, evt.target.textContent.trim())
                });

                tagger.onmouseleave = (() => table.finish(false))
            };
            let neTagItemFill = function () {
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

            let neTagItem = new TableItem(neTagItemData, neTagItemField, row, true);

            neTagItem.setOnClick(neTagItemSelect.bind(neTagItem));
            neTagItem.setFill(neTagItemFill.bind(neTagItem));
            Object.entries(tagCombos).forEach(([tag, combo]) => {
                neTagItem.setSequenceCombo(combo, () => tagAction.bind(neTagItem)(tag))
            });
            neTagItem.setSimpleCombo('backspace', () => tagAction.bind(neTagItem)('O'));
            row.addItem(neTagItemField, neTagItem);

            let neEmbItemField = 'NE-EMB';
            let neEmbItemData = row.data[neEmbItemField];
            let neEmbItemSelect = neTagItemSelect;
            let neEmbItemFill = neTagItemFill;

            let neEmbItem = new TableItem(neEmbItemData, neEmbItemField, row, true);

            neEmbItem.setOnClick(neEmbItemSelect.bind(neEmbItem));
            neEmbItem.setFill(neEmbItemFill.bind(neEmbItem));
            Object.entries(tagCombos).forEach(([tag, combo]) => {
                neEmbItem.setSequenceCombo(combo, () => tagAction.bind(neEmbItem)(tag))
            });
            neEmbItem.setSimpleCombo('backspace', () => tagAction.bind(neEmbItem)('O'));
            row.addItem(neEmbItemField, neEmbItem);

            let idItemField = 'ID';
            let idItemData = row.data[idItemField];
            let idItemSelect = tokenItemSelect;
            let idItemFill = function () {
                this.clear();
                if (String(this.data).match(/^Q[0-9]+.*/g) == null) {
                    this.setText(this.data)
                }
                else {
                    this.clear();

                    let regex = /.*?(Q[0-9]+).*?/g;
                    for (let i = 0; i <= 2; ++i) {
                        match = regex.exec(this.data);
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

            let idItem = new TableItem(idItemData, idItemField, row, true);

            idItem.setOnClick(idItemSelect.bind(idItem));
            idItem.setFill(idItemFill.bind(idItem));
            idItem.setSimpleCombo('enter', idItemSelect.bind(idItem));
            row.addItem(idItemField, idItem);

            Object.entries(row.items).forEach(([field, item]) => {
                item.setOnMouseOver((event) => {
                    if (!table.beingEdited) {
                        event.target.focus()
                    }
                });
                item.fill()
            });

            table.body.addRow(row);
            prevRow = row
        }

        if (table.sliderRgn.value != table.startIndex) {
            table.sliderRgn.value = table.data.length - table.startIndex
        }
    },

    stepsBackward: function (nrows) {
        if (table.beingEdited) return;

        if (table.startIndex >= nrows) {
            table.startIndex -= nrows;
            table.endIndex -= nrows
        }
        else {
            table.startIndex = 0;
            table.endIndex = table.displayRows
        }

        table.update()
    },

    stepsForward: function (nrows) {
        if (table.beingEdited) return;

        if (table.endIndex + nrows < table.data.length) {
            table.endIndex += nrows;
            table.startIndex = table.endIndex - table.displayRows
        }
        else {
            table.endIndex = table.data.length;
            table.startIndex = table.endIndex - table.displayRows
        }

        table.update()
    },

    sanitize: function () {
        function removeEol(row, col) {
            row[col] = row[col].toString().replace(/(\r\n|\n|\r)/gm, "")
        }

        function updateBounds(row) {
            table.minLeft =
                (parseInt(row['left']) < table.minLeft) ? parseInt(row['left']) : table.minLeft;
            table.maxRight =
                (parseInt(row['right']) > table.maxRight) ? parseInt(row['right']) : table.maxRight;

            table.minTop =
                (parseInt(row['top']) < table.minTop) ? parseInt(row['top']) : table.minTop;
            table.maxBottom =
                (parseInt(row['bottom']) > table.maxBottom) ? parseInt(row['bottom']) : table.maxBottom;
        }

        let word_pos = 1;

        table.data.forEach((row) => {
            updateBounds(row);

            Object.keys(row).forEach((col) => {
                if (row[col] == null) {
                    row[col] = "";
                }
                if (row[col] === "") {
                    word_pos = 0
                }
                removeEol(row, col)
            });

            row['No.'] = word_pos;

            word_pos++
        })
    },

    update: function () {
        table.beingEdited = false;

        let pRow = 0;

        for (let nRow = table.startIndex; nRow < table.endIndex; ++nRow) {
            let row = table.body.rows[pRow];
            row.data = table.data[nRow];

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

        if (table.sliderRgn.value != table.startIndex) {
            table.sliderRgn.value = table.data.length - table.startIndex
        }

        table.body.rows.forEach((row) => {
            if (row.hasFocusIn()) {
                updatePreview(row.data, table.urls)
            }
        })
    }
}
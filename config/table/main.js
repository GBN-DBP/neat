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

    setData(data) {
        this.data = data
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

    setFocus(callback) {
        $(this.element).focus(callback)
    }

    clear() {
        this.element.innerHTML = ''
    }

    setClickAction(clickAction) {
        this.clickAction = clickAction
    }

    setFillAction(fillAction) {
        this.fillAction = fillAction
    }

    setSimpleCombo(keys, action) {
        this.listener.simple_combo({
            keys: keys,
            on_keydown: action,
            is_solitary: true,
            is_exclusive: true
        })
    }

    setSequenceCombo(keys, action) {
        this.listener.sequence_combo({
            keys: keys,
            on_keydown: action,
            is_sequence: true,
            is_solitary: true,
            is_exclusive: true
        })
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

    setNextRow(nextRow) {
        this.nextRow = nextRow;
    }

    addItem(field, item) {
        this.items[field] = item;
        this.element.append(item.element)
    }

    setData(data) {
        this.data = data
    }

    setFocus(callback) {
        $(this.element).focus(callback)
    }

    setSequenceCombo(keys, action) {
        this.listener.sequence_combo({
            keys: keys,
            on_keydown: action,
            is_sequence: true,
            is_solitary: true,
            is_exclusive: true
        })
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

    head: null,
    body: null,

    minLeft: 1000000000,
    maxRight: 0,
    minTop: 1000000000,
    maxBottom: 0,

    data: null,

    element: null,

    urls: null,
    listener_defaults: null,
    notifyChange: null,

    beingEdited: false,

    init: function (data, urls, listener_defaults, notifyChange) {
        table.data = data.data;
        table.urls = urls;
        table.listener_defaults = listener_defaults;
        table.notifyChange = notifyChange;

        table.sanitize();

        table.element = document.createElement('table');
        table.element.id = "table";

        let fields = ['No.', 'TOKEN', 'NE-TAG', 'NE-EMB', 'ID'];

        table.head = new TableHead(fields);
        table.element.append(table.head.element);

        table.head.addField("LOCATION");
        fields.forEach((field) => table.head.addField(field));

        table.head.setPrevButton(function () { table.stepsBackward(table.displayRows) });
        table.head.setNextButton(function () { table.stepsForward(table.displayRows) });

        table.body = new TableBody();
        table.element.append(table.body.element);

        let prevRow = null;

        for (let nRow = table.startIndex; nRow < table.endIndex; ++nRow) {
            let row = new TableRow(table.data[nRow], nRow, prevRow);

            if (prevRow != null) {
                prevRow.setNextRow(row);
            }
        
            // row.setFocus(() => {
            $(row.element).focusin(() => {
                updatePreview(row.data, table.urls);

                $('#preview-rgn').css('transform', 'translate(0,' + ($(row.element).position().top + $(row.element).height()/2) + 'px)'
                    + ' translate(0%,-50%)')
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
                'sentence': '&#9735;&nbsp;sentence',
                'split': '&#8597;&nbsp;&nbsp;split',
                'merge': '&#10227;&nbsp;merge',
                'delete': '&#9447;&nbsp;delete'
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
            let noItemOnClick = function () {
                if (table.beingEdited) return;

                this.clear();
                this.setClass("hover");

                let performAction = function (action) {
                    this.setText(this.data);
                    this.setClass("editable hover");

                    rowActions[action].bind(this.parentRow)();

                    $(this.element).focus()
                };

                let cancel = function () {
                    this.setText(this.data);
                    this.setClass("editable hover");

                    $(this.element).focus()
                };

                let tokenizer = document.createElement('div');
                tokenizer.className = "accordion";
                tokenizer.id = "tokenizer";
                tokenizer.style = "display:block;";

                Object.entries(rowActionTexts).forEach(([id, text]) => {
                    let section = document.createElement('section');
                    section.className = "accordion-item tokenizer-action";
                    section.id = id;
                    section.innerText = encodeURI(text);

                    tokenizer.append(section)
                });
                this.element.append(tokenizer);

                $('#tokenizer').mouseleave(cancel.bind(this));
                $('.tokenizer-action').click((evt) => {
                    evt.stopPropagation();
                    performAction.bind(this)(evt.target.id)
                })
            };
            let noItemFill = function () {
                this.clear();
                this.setText(this.data)
            };

            let noItem = new TableItem(noItemData, noItemField, row, true);

            noItem.setOnClick(noItemOnClick.bind(noItem));
            noItem.setFill(noItemFill.bind(noItem));
            row.addItem(noItemField, noItem);

            let tokenItemField = 'TOKEN';
            let tokenItemData = row.data[tokenItemField];
            let tokenItemOnClick = function () {
                if (table.beingEdited) return;

                table.beingEdited = true;

                this.clear();
                this.setClass("editable hover");
                
                let confirm = function (keyboard, listener, textArea) {
                    this.setClass("editable hover");
                    keyboard.listener.reset();
                    listener.reset();

                    this.setData(textArea.value);
                    table.data[this.parentRow.nRow][this.field] = this.data;

                    table.sanitize();
                    table.notifyChange();
                    table.update();

                    table.beingEdited = false;

                    // this.keyboard.clear();
                    $('.simple-keyboard').html("");

                    $(this.element).focus()
                };

                let cancel = function (keyboard, listener) {
                    this.setClass("editable hover");
                    keyboard.listener.reset();
                    listener.reset();

                    table.sanitize();
                    table.notifyChange();
                    table.update();

                    table.beingEdited = false;

                    // this.keyboard.clear();
                    $('.simple-keyboard').html("");

                    $(this.element).focus()
                };

                let textArea = document.createElement('textarea');
                textArea.style.width = this.element.clientWidth + 'px';
                textArea.style.height = this.element.clientHeight + 'px';
                textArea.className = "input";

                textArea.value = this.data;
                this.element.append(textArea);
                $(textArea).focus();

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

                this.element.append(buttons);

                let keyboard = new Keyboard(textArea, table.listener_defaults);

                let listener = new window.keypress.Listener(textArea, table.listener_defaults);

                listener.simple_combo('enter', () => confirm.bind(this)(keyboard, listener, textArea));
                listener.simple_combo('esc', () => cancel.bind(this)(keyboard, listener));
                listener.simple_combo('ctrl', keyboard.toggleLayout.bind(keyboard));

                ok_btn.onclick = (evt) => {
                    evt.stopPropagation();
                    confirm.bind(this)(keyboard, listener, textArea)
                };
                cancel_btn.onclick = (evt) => {
                    evt.stopPropagation();
                    cancel.bind(this)(keyboard, listener)
                };
            };
            let tokenItemFill = function () {
                this.clear();
                this.setText(this.data)
            };

            // TODO: Set background color depending on confidence value (if available)
            let tokenItem = new TableItem(tokenItemData, tokenItemField, row, true);

            tokenItem.setOnClick(tokenItemOnClick.bind(tokenItem));
            tokenItem.setFill(tokenItemFill.bind(tokenItem));
            tokenItem.setSimpleCombo('enter', tokenItemOnClick.bind(tokenItem));
            row.addItem(tokenItemField, tokenItem);

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

            let tagItemField = 'NE-TAG';
            let tagItemData = row.data[tagItemField];
            let tagItemTag = function (tag) {
                table.data[this.parentRow.nRow][this.field] = tag;
                this.setData(tag);
                this.fill();
                table.notifyChange()
            };
            let tagItemOnClick = function () {
                if (table.beingEdited) return;

                table.beingEdited = true;

                let performTag = function (tag) {
                    this.setClass("editable hover");

                    tagItemTag.bind(this)(tag);
                    this.fill();

                    $(this.element.lastChild).mouseleave();

                    table.beingEdited = false
                };

                let cancel = function () {
                    this.setClass("editable hover");
                    this.fill();

                    table.beingEdited = false
                };

                let tagger = document.createElement('div');
                tagger.className = "accordion";
                tagger.style = "display:block;";

                let o_section = document.createElement('section');
                o_section.className = "accordion-item type_select";
                o_section.innerText = "O";
                o_section.onclick = (evt) => performTag.bind(this)($(evt.target).text().trim());

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
                    elm.onclick = (evt) => performTag.bind(this)($(evt.target).text().trim());

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
                    elm.onclick = (evt) => performTag.bind(this)($(evt.target).text().trim());

                    i_section_content.append(elm)
                });

                this.clear();
                this.setClass("hover");
                this.element.append(tagger);

                $(tagger).mouseleave(cancel.bind(this))
            };
            let tagItemFill = function () {
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

            let tagItem = new TableItem(tagItemData, tagItemField, row, true);

            tagItem.setOnClick(tagItemOnClick.bind(tagItem));
            tagItem.setFill(tagItemFill.bind(tagItem));
            Object.entries(tagCombos).forEach(([tag, combo]) => {
                tagItem.setSequenceCombo(combo, () => tagItemTag.bind(tagItem)(tag))
            });
            tagItem.setSimpleCombo('backspace', () => tagItemTag.bind(tagItem)('O'));
            row.addItem(tagItemField, tagItem);

            tagItemField = 'NE-EMB';
            tagItemData = row.data[tagItemField];

            tagItem = new TableItem(tagItemData, tagItemField, row, true);

            tagItem.setOnClick(tagItemOnClick.bind(tagItem));
            tagItem.setFill(tagItemFill.bind(tagItem));
            Object.entries(tagCombos).forEach(([tag, combo]) => {
                tagItem.setSequenceCombo(combo, () => tagItemTag.bind(tagItem)(tag))
            });
            tagItem.setSimpleCombo('backspace', () => tagItemTag.bind(tagItem)('O'));
            row.addItem(tagItemField, tagItem);

            let idItemField = 'ID';
            let idItemData = row.data[idItemField];
            let idItemOnClick = tokenItemOnClick;
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

            idItem.setOnClick(idItemOnClick.bind(idItem));
            idItem.setFill(idItemFill.bind(idItem));
            idItem.setSimpleCombo('enter', idItem.onclick);
            row.addItem(idItemField, idItem);

            Object.entries(row.items).forEach(([field, item]) => {
                item.setOnMouseOver((event) => {
                    if (!table.beingEdited) {
                        $(event.target).focus()
                    }
                });
                item.fill()
            });

            table.body.addRow(row);
            prevRow = row
        }

        if ($("#docpos").val() != table.startIndex) {
            $("#docpos").val(table.data.length - table.startIndex)
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
        function null2empty(row, col) {
            if (row[col] == null) {
                row[col] = ''
            }
        }

        function nullValue(row, col) {
            return row[col] == null
        }

        function emptyValue(row, col) {
            return row[col].toString().length == 0
        }

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

        table.data.forEach(row => {
            updateBounds(row);

            Array(['TOKEN', 'NE-TAG', 'NE-EMB', 'ID']).forEach(col => {
                if (nullValue(row, col)) {
                    null2empty(row, col)
                }
                removeEol(row, col)
            });

            Array(['TOKEN']).forEach(col => {
                if (emptyValue(row, col)) {
                    word_pos = 0
                }
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
            row.setData(table.data[nRow]);

            Object.entries(row.items).forEach(([field, item]) => {
                if (field === 'LOCATION') {
                    item.setData(nRow.toString())
                }
                else {
                    item.setData(row.data[field])
                }
                item.fill()
            });

            pRow++
        }

        if ($("#docpos").val() != table.startIndex) {
            $("#docpos").val(table.data.length - table.startIndex)
        }

        if ($(':focus').data('tableInfo')) {
            updatePreview(table.data[$(':focus').data('tableInfo').nRow], table.urls)
        }
    }
}
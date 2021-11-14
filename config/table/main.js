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
    constructor (data, isEditable) {
        this.data = data;

        this.element = document.createElement('td');
        this.element.className = isEditable ? "editable hover" : "hover";
        this.element.innerText = this.data;

        this.listener = new window.keypress.Listener(this.element, { prevent_repeat: true })
    }

    setData(data) {
        this.data = data
    }

    setText(text) {
        this.element.innerText = text
    }

    setLink(url, text) {
        let link = document.createElement('a');
        link.innerText = text;
        link.href = url;
        link.onclick = (event) => event.stopPropagation();

        this.element.append(link);
        this.element.append(document.createElement('br'))
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
    constructor (data, nRow) {
        this.data = data;
        this.nRow = nRow;

        this.element = document.createElement('tr');

        this.items = {};

        this.listener = new window.keypress.Listener(this.element, { prevent_repeat: true })
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

    element: null,

    head: null,
    body: null,

    dataFields: new Set(['TOKEN', 'conf', 'TEXT', 'ocrconf', 'ID', 'NE-TAG', 'NE-EMB']),
    ctrlFields: new Set(['url_id', 'left', 'right', 'top', 'bottom']),
    nmbrField: 'No.',

    hiddenFields: new Set(['url_id', 'left', 'right', 'top', 'bottom', 'ocrconf', 'conf']),
    editFields: new Set(['TOKEN', 'TEXT', 'ID']),
    textFields: new Set(['TOKEN', 'TEXT']),
    linkFields: new Set(['ID']),
    tagFields: new Set(['NE-TAG', 'NE-EMB']),
    confFields: new Set(['ocrconf', 'conf']),

    tagClasses: 'ner_per ner_loc ner_org ner_work ner_conf ner_evt ner_todo',

    minLeft: 1000000000,
    maxRight: 0,
    minTop: 1000000000,
    maxBottom: 0,

    data: null,
    fields: null,

    urls: null,
    listener_defaults: null,
    notifyChange: null,

    editingTd: null,

    init: function (data, urls, listener_defaults, notifyChange) {
        table.data = data.data;
        table.fields = data.meta.fields;
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

        table.head.setPrevButton(() => table.stepsBackward(table.displayRows));
        table.head.setNextButton(() => table.stepsForward(table.displayRows));

        table.body = new TableBody();
        table.element.append(table.body.element);

        for (let nRow = table.startIndex; nRow < table.endIndex; ++nRow) {
            let row = new TableRow(table.data[nRow], nRow);
        
            // row.setFocus(() => {
            $(row.element).focusin(() => {
                console.log('focusin');
                updatePreview(row.data, table.urls);

                $('#preview-rgn').css('transform', 'translate(0,' + ($(row.element).position().top + $(row.element).height()/2) + 'px)'
                    + ' translate(0%,-50%)')
            });

            row.setSequenceCombo('s t', table.sentenceAction);
            row.setSequenceCombo('s p', table.splitAction);
            row.setSequenceCombo('m e', table.mergeAction);
            row.setSequenceCombo('d l', table.deleteAction);

            let locItem = new TableItem(nRow.toString(), false);
            locItem.setClickAction(() => console.log("Do something different"));
            locItem.setFillAction(() => locItem.setText(locItem.data));
            row.addItem('LOCATION', locItem);

            let noItem = new TableItem(row.data['No.'], true);
            noItem.setClickAction(table.makeLineSplitMerge);
            noItem.setFillAction(() => noItem.setText(noItem.data));
            row.addItem('No.', noItem);

            // TODO: Set background color depending on confidence value (if available)
            let tokenItem = new TableItem(row.data['TOKEN'], true);
            tokenItem.setClickAction(table.makeTdEditable);
            tokenItem.setFillAction(() => tokenItem.setText(tokenItem.data));
            tokenItem.setSimpleCombo('enter', tokenItem.clickAction);
            row.addItem('TOKEN', tokenItem);

            let tagAction = (tag, field, item) => {
                table.data[nRow][field] = tag;
                item.setText(tag);
                table.colorCodeNETag();
                table.notifyChange()
            }

            let tagItem = new TableItem(row.data['NE-TAG'], true);
            tagItem.setClickAction(table.makeTagEdit);
            tagItem.setFillAction(() => tagItem.setText(tagItem.data));
            tagItem.setSequenceCombo('b p', () => tagAction('B-PER', 'NE-TAG', tagItem));
            tagItem.setSequenceCombo('b l', () => tagAction('B-LOC', 'NE-TAG', tagItem));
            tagItem.setSequenceCombo('b o', () => tagAction('B-ORG', 'NE-TAG', tagItem));
            tagItem.setSequenceCombo('b w', () => tagAction('B-WORK', 'NE-TAG', tagItem));
            tagItem.setSequenceCombo('b c', () => tagAction('B-CONF', 'NE-TAG', tagItem));
            tagItem.setSequenceCombo('b e', () => tagAction('B-EVT', 'NE-TAG', tagItem));
            tagItem.setSequenceCombo('b t', () => tagAction('B-TODO', 'NE-TAG', tagItem));
            tagItem.setSequenceCombo('i p', () => tagAction('I-PER', 'NE-TAG', tagItem));
            tagItem.setSequenceCombo('i l', () => tagAction('I-LOC', 'NE-TAG', tagItem));
            tagItem.setSequenceCombo('i o', () => tagAction('I-ORG', 'NE-TAG', tagItem));
            tagItem.setSequenceCombo('i w', () => tagAction('I-WORK', 'NE-TAG', tagItem));
            tagItem.setSequenceCombo('i c', () => tagAction('I-CONF', 'NE-TAG', tagItem));
            tagItem.setSequenceCombo('i e', () => tagAction('I-EVT', 'NE-TAG', tagItem));
            tagItem.setSequenceCombo('i t', () => tagAction('I-TODO', 'NE-TAG', tagItem));
            tagItem.setSimpleCombo('backspace', () => tagAction('O', 'NE-TAG', tagItem));
            row.addItem('NE-TAG', tagItem);

            tagItem = new TableItem(row.data['NE-EMB'], true);
            tagItem.setClickAction(table.makeTagEdit);
            tagItem.setFillAction(() => tagItem.setText(tagItem.data));
            tagItem.setSequenceCombo('b p', () => tagAction('B-PER', 'NE-EMB', tagItem));
            tagItem.setSequenceCombo('b l', () => tagAction('B-LOC', 'NE-EMB', tagItem));
            tagItem.setSequenceCombo('b o', () => tagAction('B-ORG', 'NE-EMB', tagItem));
            tagItem.setSequenceCombo('b w', () => tagAction('B-WORK', 'NE-EMB', tagItem));
            tagItem.setSequenceCombo('b c', () => tagAction('B-CONF', 'NE-EMB', tagItem));
            tagItem.setSequenceCombo('b e', () => tagAction('B-EVT', 'NE-EMB', tagItem));
            tagItem.setSequenceCombo('b t', () => tagAction('B-TODO', 'NE-EMB', tagItem));
            tagItem.setSequenceCombo('i p', () => tagAction('I-PER', 'NE-EMB', tagItem));
            tagItem.setSequenceCombo('i l', () => tagAction('I-LOC', 'NE-EMB', tagItem));
            tagItem.setSequenceCombo('i o', () => tagAction('I-ORG', 'NE-EMB', tagItem));
            tagItem.setSequenceCombo('i w', () => tagAction('I-WORK', 'NE-EMB', tagItem));
            tagItem.setSequenceCombo('i c', () => tagAction('I-CONF', 'NE-EMB', tagItem));
            tagItem.setSequenceCombo('i e', () => tagAction('I-EVT', 'NE-EMB', tagItem));
            tagItem.setSequenceCombo('i t', () => tagAction('I-TODO', 'NE-EMB', tagItem));
            tagItem.setSimpleCombo('backspace', () => tagAction('O', 'NE-EMB', tagItem));
            row.addItem('NE-EMB', tagItem);

            let idItem = new TableItem(row.data['ID'], true);
            idItem.setClickAction(table.makeTdEditable);
            idItem.setFillAction(() => {
                if (String(idItem.data).match(/^Q[0-9]+.*/g) == null) {
                    idItem.setText(idItem.data)
                }
                else {
                    idItem.clear();

                    let regex = /.*?(Q[0-9]+).*?/g;
                    for (let i = 0; i <= 2; ++i) {
                        match = regex.exec(idItem.data);
                        if (match === null) {
                            break
                        }

                        idItem.setLink("https://www.wikidata.org/wiki/" + match[1], match[1])
                    }
                }
            });
            idItem.setSimpleCombo('enter', idItem.clickAction);
            row.addItem('ID', idItem);

            Object.entries(row.items).forEach(([field, item]) => {
                // item.setFocus(() => $(row.element).focus());
                $(item.element).focus(() => {
                    console.log('focus')
                });
                item.setOnMouseOver((event) => {
                    if (table.editingTd == null) {
                        $(event.target).focus()
                    }
                });
                item.fillAction()
            });

            table.body.addRow(row)
        }

        table.colorCodeNETag();

        if ($("#docpos").val() != table.startIndex) {
            $("#docpos").val(table.data.length - table.startIndex)
        }

        console.log('done');
    },

    getDataFields: function () {
        return table.fields.filter(x => table.dataFields.has(x))
    },

    getCtrlFields: function () {
        return table.fields.filter(x => table.ctrlFields.has(x))
    },

    getHiddenFields: function () {
        return table.fields.filter(x => table.hiddenFields.has(x))
    },

    getEditFields: function () {
        return table.fields.filter(x => table.editFields.has(x))
    },

    getTextFields: function () {
        return table.fields.filter(x => table.textFields.has(x))
    },

    getLinkFields: function () {
        return table.fields.filter(x => table.linkFields.has(x))
    },

    getTagFields: function () {
        return table.fields.filter(x => table.tagFields.has(x))
    },

    getConfFields: function () {
        return table.fields.filter(x => table.confFields.has(x))
    },

    stepsBackward: function (nrows) {
        if (table.editingTd != null) return;

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
        if (table.editingTd != null) return;

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

    sentenceAction: function (nRow) {
        if (table.editingTd != null) return true;

        let new_line = JSON.parse(JSON.stringify(table.data[nRow]));

        table.getEditFields().forEach(col => {
            new_line[col] = ''
        });

        table.getTagFields().forEach(col => {
            new_line[col] = 'O'
        });

        table.data.splice(nRow, 0, new_line);

        table.sanitize();
        table.notifyChange();
        table.update()
    },

    mergeAction: function (nRow) {
        if (table.editingTd != null) return;

        if (nRow < 1) return;

        table.getTextFields().forEach(col => {
            table.data[nRow - 1][col] = table.data[nRow - 1][col].toString() + table.data[nRow][col].toString()
        });

        table.data.splice(nRow, 1);

        table.sanitize();
        table.notifyChange();
        table.update()
    },

    splitAction: function (nRow) {
        if (table.editingTd != null) return;

        table.data.splice(nRow, 0, JSON.parse(JSON.stringify(table.data[nRow])));

        table.sanitize();
        table.notifyChange();
        table.update()
    },

    deleteAction: function (nRow) {
        if (table.editingTd != null) return;

        table.data.splice(nRow, 1);

        table.sanitize();
        table.notifyChange();
        table.update()
    },

    makeLineSplitMerge: function (td) {
        let tableInfo = $(td).data('tableInfo');

        table.editingTd = {
            data: table.data[tableInfo.nRow][tableInfo.column],
            performAction: function (action) {
                $(td).html(table.editingTd.data);
                $(td).addClass('editable');

                table.editingTd = null;

                switch (action) {
                    case 'sentence':
                        table.sentenceAction(table, tableInfo.nRow);
                        break;
                    case 'split':
                        table.splitAction(table, tableInfo.nRow);
                        break;
                    case 'merge':
                        table.mergeAction(table, tableInfo.nRow);
                        break;
                    case 'delete':
                        table.deleteAction(table, tableInfo.nRow);
                        break;
                    default:
                }

                $(td).focus()
            },
            cancel: function () {
                $(td).html(table.editingTd.data);
                $(td).addClass('editable');

                table.editingTd = null;

                $(td).focus()
            }
        };

        let edit_html = `
            <div class="accordion" id="tokenizer" style="display:block;">
                <section class="accordion-item tokenizer-action" id="split">&#8597;&nbsp;&nbsp;split</section>
                <section class="accordion-item tokenizer-action" id="merge">&#10227;&nbsp;merge</section>
                <section class="accordion-item tokenizer-action" id="sentence">&#9735;&nbsp;sentence</section>
                <section class="accordion-item tokenizer-action" id="delete">&#9447;&nbsp;delete</section>
            </div>`;

        $(td).removeClass('editable');
        $(td).html(edit_html);

        $('#tokenizer').mouseleave( function(event) { table.editingTd.cancel(); });
        $('.tokenizer-action').click(function(event) { table.editingTd.performAction(event.target.id); });
    },

    makeTdEditable: function (td, content) {
        $(td).removeClass('editable');

        let tableInfo = $(td).data('tableInfo');

        table.editingTd = {
            finish:
                function (isOk) {
                    $(td).addClass('editable');
                    keyboard.listener.reset();
                    listener.reset();

                    if (isOk) {
                        let newValue = $('#edit-area').val();

                        table.data[tableInfo.nRow][tableInfo.column] = newValue;

                        table.sanitize();
                        table.notifyChange();
                        table.update();
                    }

                    tableInfo.fillAction($(td));
                    table.editingTd = null;

                    $(".simple-keyboard").html("");

                    $(td).focus();
                }
        };

        let textArea = document.createElement('textarea');
        textArea.style.width = td.clientWidth + 'px';
        textArea.style.height = td.clientHeight + 'px';
        textArea.className = "input";
        textArea.id = 'edit-area';

        $(textArea).val(table.data[tableInfo.nRow][tableInfo.column]);
        $(td).html('');
        $(td).append(textArea);
        textArea.focus();

        let edit_html =
            `<div>
                <button class="btn btn-secondary btn-sm" id="edit-ok">OK</button>
                <button class="btn btn-secondary btn-sm" id="edit-cancel">CANCEL</button>
                <!--<button class="btn btn-secondary btn-sm" id="keyboard">Toggle Keyboard</button>
                <div class="simple-keyboard"></div>-->
             </div>`;

        td.insertAdjacentHTML("beforeEnd", edit_html);

        $('#edit-ok').on('click', function (evt) {
            table.editingTd.finish(true)
        });

        $('#edit-cancel').on('click', function (evt) {
            table.editingTd.finish(false)
        });

        let keyboard = new Keyboard(textArea, table.listener_defaults);

        let listener = new window.keypress.Listener($('#edit-area'), table.listener_defaults);

        listener.simple_combo('enter', function() { $('#edit-ok').click(); } );
        listener.simple_combo('esc', function() { $('#edit-cancel').click(); } );
        listener.simple_combo('ctrl', keyboard.toggleLayout.bind(keyboard));
    },

    makeTagEdit: function (td) {
        let tableInfo = $(td).data('tableInfo');

        table.editingTd = {
            data: table.data[tableInfo.nRow][tableInfo.column],
            finish: function(isOk) {
                tableInfo.fillAction($(td))

                $(td).addClass('editable');

                table.editingTd = null;

                table.colorCodeNETag();

                table.notifyChange();
            }
        };

        let edit_html = `
            <div class="accordion" id="tagger" style="display:block;">
                <section class="accordion-item type_select">O
                </section>
                <section class="accordion-item">B
                    <div class="accordion-item-content">
                        <div class="ner_per type_select">B-PER</div>
                        <div class="ner_loc type_select">B-LOC</div>
                        <div class="ner_org type_select">B-ORG</div>
                        <div class="ner_work type_select">B-WORK</div>
                        <div class="ner_conf type_select">B-CONF</div>
                        <div class="ner_evt type_select">B-EVT</div>
                        <div class="ner_todo type_select">B-TODO</div>
                    </div>
                </section>
                <section class="accordion-item">I
                    <div class="accordion-item-content">
                        <div class="ner_per type_select">I-PER</div>
                        <div class="ner_loc type_select">I-LOC</div>
                        <div class="ner_org type_select">I-ORG</div>
                        <div class="ner_work type_select">I-WORK</div>
                        <div class="ner_conf type_select">I-CONF</div>
                        <div class="ner_evt type_select">I-EVT</div>
                        <div class="ner_todo type_select">I-TODO</div>
                    </div>
                </section>
            </div>
        `;

        $(td).removeClass('editable');
        $(td).html(edit_html);
        $('#tagger').mouseleave( function(event) { table.editingTd.finish(false) });

        $('.type_select').click(function (event) {
            table.data[tableInfo.nRow][tableInfo.column] = $(event.target).text().trim();

            table.editingTd.finish(true)
        })
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

            table.getDataFields().forEach(col => {
                if (nullValue(row, col)) {
                    null2empty(row, col)
                }
                removeEol(row, col)
            });

            table.getTextFields().forEach(col => {
                if (emptyValue(row, col)) {
                    word_pos = 0
                }
            });

            row[table.nmbrField] = word_pos;

            word_pos++
        })
    },

    colorCodeNETag: function () {
        $(".editable").removeClass(table.tagClasses);

        $("#table td:contains('B-PER')").addClass('ner_per');
        $("#table td:contains('I-PER')").addClass('ner_per');
        $("#table td:contains('B-LOC')").addClass('ner_loc');
        $("#table td:contains('I-LOC')").addClass('ner_loc');
        $("#table td:contains('B-ORG')").addClass('ner_org');
        $("#table td:contains('I-ORG')").addClass('ner_org');
        $("#table td:contains('B-WORK')").addClass('ner_work');
        $("#table td:contains('I-WORK')").addClass('ner_work');
        $("#table td:contains('B-CONF')").addClass('ner_conf');
        $("#table td:contains('I-CONF')").addClass('ner_conf');
        $("#table td:contains('B-EVT')").addClass('ner_evt');
        $("#table td:contains('I-EVT')").addClass('ner_evt');
        $("#table td:contains('B-TODO')").addClass('ner_todo');
        $("#table td:contains('I-TODO')").addClass('ner_todo');
    },

    update: function () {
        table.editingTd = null;

        let pRow = 0;

        for (let nRow = table.startIndex; nRow < table.endIndex; ++nRow) {
            let row = table.body.rows[pRow];
            row.setData(table.data[nRow]);

            Object.entries(row.items).forEach(([field, item]) => {
                if (field == 'LOCATION') {
                    item.setText(nRow.toString())
                }
                else {
                    item.setData(row.data[field]);
                    item.setText(row.data[field])
                }
                item.fillAction()
            });

            pRow++
        }

        table.colorCodeNETag();

        if ($("#docpos").val() != table.startIndex) {
            $("#docpos").val(table.data.length - table.startIndex)
        }

        if ($(':focus').data('tableInfo')) {
            updatePreview(table.data[$(':focus').data('tableInfo').nRow], table.urls)
        }
    }
}
let table = {
    displayRows: 15,
    startIndex: 0,
    endIndex: 15,

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

    rows: null,
    fields: null,

    urls: null,
    listener_defaults: null,
    notifyChange: null,

    editingTd: null,

    init: function (data, urls, listener_defaults, notifyChange) {
        table.rows = data.data;
        table.fields = data.meta.fields;
        table.urls = urls;
        table.listener_defaults = listener_defaults;
        table.notifyChange = notifyChange;

        table.sanitize();

        let editable_html =`<td class="editable hover">`;

        $.each(table.rows, (nRow, el) => {
            if (nRow < table.startIndex) return;
            if (nRow >= table.endIndex) return;

            let row = $("<tr/>").data('tableInfo', { 'nRow': nRow });

            row.focusin(function () {
                updatePreview(table.rows[row.data('tableInfo').nRow], table.urls);

                $('#preview-rgn').css('transform', 'translate(0,' + (row.position().top + row.height()/2) + 'px)'
                    + ' translate(0%,-50%)')
            });

            row.append($('<td class="hover"/>').text(nRow).data('tableInfo', { 'nRow': nRow }));

            let row_listener = new window.keypress.Listener(row, table.listener_defaults);

            row_listener.register_many([{
                keys: 's t',
                on_keydown: () => table.sentenceAction(table, row.data('tableInfo').nRow),
                is_sequence: true,
                is_solitary: true,
                is_exclusive: true
            }, {
                keys: 's p',
                on_keydown: () => table.splitAction(table, row.data('tableInfo').nRow),
                is_sequence: true,
                is_solitary: true,
                is_exclusive: true
            }, {
                keys: 'm e',
                on_keydown: () => table.mergeAction(table, row.data('tableInfo').nRow),
                is_sequence: true,
                is_solitary: true,
                is_exclusive: true
            }, {
                keys: 'd l',
                on_keydown: () => table.deleteAction(table, row.data('tableInfo').nRow),
                is_sequence: true,
                is_solitary: true,
                is_exclusive: true
            }]);

            $.each(el, (column, content) => {
                let td = $(editable_html)

                let listener = new window.keypress.Listener(td, table.listener_defaults);

                if (table.hiddenFields.has(column)) return

                let clickAction = function() { console.log('Do something different'); }

                let fillAction = (function(column) {
                    return function(td) {
                        let tableInfo = $(td).data('tableInfo');

                        let content = table.rows[tableInfo.nRow][tableInfo.column];

                        td.text(content);

                        if ((table.textFields.has(column)) && (table.fields.some(x => table.confFields.has(x)))) {
                            td.css('background-color', table.fields.find(x => table.confFields.has(x)));
                        }

                    }
                })(column);

                let head_html = `
                <th id="${column}">
                    <div class="d-flex align-items-center" ><div class="flex-grow-1">${column}</div></div>
                </th>`;

                if (!($("th#" + column.replace(/\./g, "\\.")).length)) {
                    $("#tablehead").append(head_html);
                }

                if (column == table.nmbrField) {
                    clickAction = table.makeLineSplitMerge;
                }
                else if (table.editFields.has(column))  {
                    clickAction = table.makeTdEditable;

                    listener.simple_combo('enter', function() { $(td).click() });

                    if (table.linkFields.has(column)) {
                        fillAction = function(td) {
                            let tableInfo = $(td).data('tableInfo');

                            let content = table.rows[tableInfo.nRow][column];

                            if (String(content).match(/^Q[0-9]+.*/g) == null) {
                                td.text(content);
                            }
                            else {
                                td.html("");

                                var reg = /.*?(Q[0-9]+).*?/g;
                                var result;
                                let count = 0;
                                while((element = reg.exec(content)) !== null) {
                                    if (count > 2) break

                                    let link = $('<a href="https://www.wikidata.org/wiki/' + element[1] +
                                        '" target="_blank" rel="noopener noreferrer">' +
                                        element[1] + "</a>");

                                    link.click(function(event) {
                                        event.stopPropagation()
                                    });

                                    td.append(link);
                                    td.append($("<br>"))
                                    count++;
                                }
                            }
                        };
                    }
                }
                else if (table.tagFields.has(column)) {
                    clickAction = table.makeTagEdit;

                    function tagAction(tag) {
                        tableInfo = $(td).data('tableInfo');

                        table.rows[tableInfo.nRow][tableInfo.column] = tag;

                        td.html(tag);
                        table.colorCodeNETag();
                        table.notifyChange()
                    };

                    listener.sequence_combo('b p', function() { tagAction('B-PER'); });
                    listener.sequence_combo('b l', function() { tagAction('B-LOC'); });
                    listener.sequence_combo('b o', function() { tagAction('B-ORG'); });
                    listener.sequence_combo('b w', function() { tagAction('B-WORK'); });
                    listener.sequence_combo('b c', function() { tagAction('B-CONF'); });
                    listener.sequence_combo('b e', function() { tagAction('B-EVT'); });
                    listener.sequence_combo('b t', function() { tagAction('B-TODO'); });

                    listener.sequence_combo('i p', function() { tagAction('I-PER'); });
                    listener.sequence_combo('i l', function() { tagAction('I-LOC'); });
                    listener.sequence_combo('i o', function() { tagAction('I-ORG'); });
                    listener.sequence_combo('i w', function() { tagAction('I-WORK'); });
                    listener.sequence_combo('i c', function() { tagAction('I-CONF'); });
                    listener.sequence_combo('i e', function() { tagAction('I-EVT'); });
                    listener.sequence_combo('i t', function() { tagAction('I-TODO'); });

                    listener.sequence_combo('backspace', function() { tagAction('O'); });
                }

                td.attr('tabindex', 0).data('tableInfo', {
                    'nRow': nRow,
                    'column': column ,
                    'clickAction': clickAction,
                    'fillAction': fillAction
                });

                fillAction(td);

                row.append(td)
            });

            $("#table tbody").append(row);
        });

        table.colorCodeNETag();

        $(".hover").on('mouseover',
            function (evt) {

                if (table.editingTd != null) return;

                $(evt.target).focus()
            }
        );

        if ($("#docpos").val() != table.startIndex) {
            $("#docpos").val(table.rows.length - table.startIndex)
        }
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

        if (table.endIndex + nrows < table.rows.length) {
            table.endIndex += nrows;
            table.startIndex = table.endIndex - table.displayRows
        }
        else {
            table.endIndex = table.rows.length;
            table.startIndex = table.endIndex - table.displayRows
        }

        table.update()
    },

    sentenceAction: function (table, nRow) {
        if (table.editingTd != null) return true;

        let new_line = JSON.parse(JSON.stringify(table.rows[nRow]));

        table.getEditFields().forEach(col => {
            new_line[col] = ''
        });

        table.getTagFields().forEach(col => {
            new_line[col] = 'O'
        });

        table.rows.splice(nRow, 0, new_line);

        table.sanitize();
        table.notifyChange();
        table.update()
    },

    mergeAction: function (table, nRow) {
        if (table.editingTd != null) return;

        if (nRow < 1) return;

        table.getTextFields().forEach(col => {
            table.rows[nRow - 1][col] = table.rows[nRow - 1][col].toString() + table.rows[nRow][col].toString()
        });

        table.rows.splice(nRow, 1);

        table.sanitize();
        table.notifyChange();
        table.update()
    },

    splitAction: function (table, nRow) {
        if (table.editingTd != null) return;

        table.rows.splice(nRow, 0, JSON.parse(JSON.stringify(table.rows[nRow])));

        table.sanitize();
        table.notifyChange();
        table.update()
    },

    deleteAction: function (table, nRow) {
        if (table.editingTd != null) return;

        table.rows.splice(nRow, 1);

        table.sanitize();
        table.notifyChange();
        table.update()
    },

    makeLineSplitMerge: function (td) {
        let tableInfo = $(td).data('tableInfo');

        table.editingTd = {
            data: table.rows[tableInfo.nRow][tableInfo.column],
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

                        table.rows[tableInfo.nRow][tableInfo.column] = newValue;

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

        $(textArea).val(table.rows[tableInfo.nRow][tableInfo.column]);
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
            data: table.rows[tableInfo.nRow][tableInfo.column],
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
            table.rows[tableInfo.nRow][tableInfo.column] = $(event.target).text().trim();

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

        table.rows.forEach(row => {
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

        let rows = $('tbody').children('tr');
        let pRow = 0;

        for (let nRow = table.startIndex; nRow < table.endIndex; ++nRow) {
            let el = table.rows[nRow];

            let row = $(rows[pRow]);
            let tableInfo = row.data('tableInfo');

            tableInfo.nRow = nRow;

            row.data('tableInfo', tableInfo);

            let loc = $(row.children('td').first());
            loc.data('tableInfo', tableInfo);
            loc.text(nRow);

            let columns = $(rows[pRow]).children('.editable');
            let pColumn = 0;

            $.each(el, (column_name, content) => {
                if (table.hiddenFields.has(column_name)) return;

                let td = $(columns[pColumn]);

                tableInfo = td.data('tableInfo');

                tableInfo.nRow = nRow;

                td.data('tableInfo', tableInfo);

                tableInfo.fillAction(td);

                pColumn++
            });

            pRow++
        }

        table.colorCodeNETag();

        if ($("#docpos").val() != table.startIndex) {
            $("#docpos").val(table.rows.length - table.startIndex)
        }

        if ($(':focus').data('tableInfo')) {
            updatePreview(table.rows[$(':focus').data('tableInfo').nRow], table.urls)
        }
    }
}
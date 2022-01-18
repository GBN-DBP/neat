class TagSection {
    constructor (tag) {
        this.tag = tag

        this.element = document.createElement('section');
        this.element.className = "accordion-item type_select editable";
        this.element.tabIndex = "0";
        this.element.textContent = this.tag;

        this.listener = new window.keypress.Listener(this.element, {prevent_repeat: true})
    }

    focus() {
        this.element.focus()
    }

    setOnClick(action) {
        this.element.onclick = action
    }

    setSimpleCombo(key, action) {
        this.listener.simple_combo(key, action)
    }
}

class Tagger {
    constructor (tags) {
        this.tags = tags;

        this.element = document.createElement('div');
        this.element.className = "accordion";
        this.element.tabIndex = "0";
        this.element.style.display = "block";

        this.sections = [];

        this.tags.forEach((tag) => {
            let section = new TagSection(tag);

            this.sections.push(section);
            this.element.append(section.element)
        });

        this.sections[0].setSimpleCombo(
            'down',
            () => this.sections[1].focus()
        );
        for (let i = 1; i < this.sections.length - 1; ++i) {
            this.sections[i].setSimpleCombo(
                'down',
                () => this.sections[i+1].focus()
            );
            this.sections[i].setSimpleCombo(
                'up',
                () => this.sections[i-1].focus()
            )
        }
        this.sections[this.sections.length-1].setSimpleCombo(
            'up',
            () => this.sections[this.sections.length-2].focus()
        );

        this.listener = new window.keypress.Listener(this.element, {prevent_repeat: true})
    }

    first() {
        return this.sections[this.tags[0]]
    }

    addSection(tag, section) {
        this.sections[tag] = section;
        this.element.append(section.element)
    }

    setOnClick(action) {
        this.element.onclick = action
    }

    setOnMouseOver(action) {
        this.element.onmouseover = action
    }

    setOnMouseLeave(action) {
        this.element.onmouseleave = action
    }

    setSimpleCombo(key, action) {
        this.listener.simple_combo(key, action)
    }
}

class TableHead {
    constructor (fields) {
        this.fields = fields;

        this.element = document.createElement('thead');

        this.tr = document.createElement('tr');
        this.element.append(this.tr);

        this.fields = {}
    }

    addField(field) {
        let th = document.createElement('th');

        let d_flex = document.createElement('div');
        d_flex.className = "d-flex align-items-center";

        let flex_grow = document.createElement('div');
        flex_grow.className = "flex-grow-1";
        flex_grow.innerText = field;

        d_flex.append(flex_grow);
        th.append(d_flex);
        this.tr.append(th)

        this.fields[field] = th;
    }

    setWidth(field, width) {
        this.fields[field].style = "width: " + width.toString() + "%"
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
            let span = document.createElement('span');
            span.style.letterSpacing = "0.3em";
            elm.append(span);
            elm = span
        }

        elm.style.fontFamily = this.fontFamily
        elm.style.fontSize = this.fontSize.toString() + "pt";

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
        this.listener.simple_combo(key, action)
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

        this.listener = new window.keypress.Listener(
            this.element,
            {
                prevent_repeat: true ,
                is_exclusive: true,
                is_solitary: true
            }
        )
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

    setSimpleCombo(keys, action) {
        this.listener.simple_combo(keys, action)
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

        this.fields = ['TOKEN', 'LANG', 'FONT-FAMILY', 'BOLD', 'ITALIC', 'LETTERSPACED'];
        this.beingEdited = false;
        this.finish = null;

        this.sanitize();

        this.element = document.createElement('table');
        this.element.id = "table";

        this.head = new TableHead(this.fields);
        this.element.append(this.head.element);

        this.fields.forEach((field) => this.head.addField(field));

        // this.head.setWidth('TOKEN', 20);

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
                // if (!this.beingEdited) {
                //     row.items['TOKEN'].setFontSize(30);
                //     row.items['TOKEN'].fill()
                // }

                updatePreview(row.data, this.urls, this.previewBounds);

                this.previewRgn.style.transform = 'translate(0,'
                    + (row.element.offsetTop + row.element.clientHeight/2) + 'px) translate(0%,-50%)'
            });

            // row.setOnFocusOut(() => {
            //     if (!this.beingEdited) {
            //         row.items['TOKEN'].setFontSize(15);
            //         row.items['TOKEN'].fill()
            //     }
            // });

            // TODO: Set background color depending on confidence value (if available)
            let tokenItem = new TableItem(row.data['TOKEN'], 'TOKEN', row, true);
            row.addItem('TOKEN', tokenItem);

            if (row.data['FONT-FAMILY'] === 'Fraktur') {
                tokenItem.fontFamily = "UnifrakturMaguntia";
            }
            else {
                tokenItem.fontFamily = "AletheiaSans";
            }

            tokenItem.fontSize = 15;

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
                textArea.style.width = this.element.clientWidth + "px";
                textArea.style.height = this.element.clientHeight + "px";
                textArea.style.fontFamily = "AletheiaSans";
                textArea.style.fontSize = "12pt";
                textArea.className = "input";
                textArea.value = this.data;

                this.append(textArea);
                textArea.focus();

                let buttons = document.createElement('div');

                let ok_btn = document.createElement('button');
                ok_btn.style.fontFamily = "AletheiaSans";
                ok_btn.className = "btn btn-secondary btn-sm";
                ok_btn.innerText = "OK";
                buttons.append(ok_btn);
                buttons.append(" ");

                let cancel_btn = document.createElement('button');
                cancel_btn.style.fontFamily = "AletheiaSans";
                cancel_btn.className = "btn btn-secondary btn-sm";
                cancel_btn.innerText = "CANCEL";
                buttons.append(cancel_btn);

                this.append(buttons);

                this.parentRow.parentTable.finish = (isOk) => {
                    this.setClass("editable hover");

                    keyboard.listener.reset();
                    listener.reset();

                    keyboard.clear();

                    if (isOk) {
                        this.parentRow.parentTable.data[this.parentRow.nRow][this.field] = textArea.value;
                        this.parentRow.parentTable.sanitize();
                        this.parentRow.parentTable.notifyChange();
                        this.parentRow.parentTable.update()
                    }

                    this.parentRow.parentTable.beingEdited = false;

                    this.fill();
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

            let langItem = new TableItem(row.data['LANG'], 'LANG', row, true);
            row.addItem('LANG', langItem);

            langItem.tagger = new Tagger(['German', 'Portuguese', 'English']);

            let langItemSelect = function () {
                if (this.parentRow.parentTable.beingEdited) return;

                this.parentRow.parentTable.beingEdited = true;

                this.clear();
                this.setClass("hover");

                this.element.append(this.tagger.element);

                this.parentRow.parentTable.finish = (isOk, tag = null) => {
                    this.tagger.listener.reset();

                    this.setClass("editable hover");

                    if (isOk && tag != null) {
                        this.parentRow.parentTable.data[this.parentRow.nRow][this.field] = tag;
                        this.parentRow.parentTable.sanitize();
                        this.parentRow.parentTable.notifyChange();
                        this.parentRow.parentTable.update()
                    }

                    this.parentRow.parentTable.beingEdited = false;

                    this.fill();
                    this.focus()
                };

                this.tagger.sections.forEach((section) => {
                    let finish = (evt) => {
                        evt.stopPropagation();
                        this.parentRow.parentTable.finish(true, section.tag)
                    };

                    section.setOnClick(finish);
                    section.setSimpleCombo('enter', finish)
                });

                this.tagger.setOnMouseLeave(() => this.parentRow.parentTable.finish(false))
            };

            langItem.setOnClick(langItemSelect.bind(langItem));
            langItem.setSimpleCombo(
                'enter',
                () => {
                    langItemSelect.bind(langItem)();
                    langItem.tagger.sections[0].focus()
                }
            );
            langItem.setSimpleCombo('escape', () => this.finish(false));

            let familyItem = new TableItem(row.data['FONT-FAMILY'], 'FONT-FAMILY', row, true);
            row.addItem('FONT-FAMILY', familyItem);

            familyItem.tagger = new Tagger(['Antiqua', 'Script', 'Gothic', 'Fraktur', 'Fraktur-Variant']);

            let familyItemSelect = function () {
                if (this.parentRow.parentTable.beingEdited) return;

                this.parentRow.parentTable.beingEdited = true;

                this.clear();
                this.setClass("hover");

                this.element.append(this.tagger.element);

                this.parentRow.parentTable.finish = (isOk, tag = null) => {
                    this.tagger.listener.reset();

                    this.setClass("editable hover");

                    if (isOk && tag != null) {
                        this.parentRow.parentTable.data[this.parentRow.nRow][this.field] = tag;
                        this.parentRow.parentTable.sanitize();
                        this.parentRow.parentTable.notifyChange();
                        this.parentRow.parentTable.update()
                    }

                    this.parentRow.parentTable.beingEdited = false;

                    this.fill();
                    this.focus()
                };

                this.tagger.sections.forEach((section) => {
                    let finish = (evt) => {
                        evt.stopPropagation();
                        this.parentRow.parentTable.finish(true, section.tag)
                    };

                    section.setOnClick(finish);
                    section.setSimpleCombo('enter', finish)
                });

                this.tagger.setOnMouseLeave(() => this.parentRow.parentTable.finish(false))
            };

            familyItem.setOnClick(familyItemSelect.bind(familyItem));
            familyItem.setSimpleCombo(
                'enter',
                () => {
                    familyItemSelect.bind(familyItem)();
                    familyItem.tagger.sections[0].focus()
                }
            );
            familyItem.setSimpleCombo('escape', () => this.finish(false));

            let boldItem = new TableItem(row.data['BOLD'], 'BOLD', row, true);
            row.addItem('BOLD', boldItem);

            let boldItemFill = function () {
                this.clear();

                this.box = document.createElement('input');
                this.box.type = "checkbox";
                this.element.append(this.box);

                if (this.parentRow.parentTable.data[this.parentRow.nRow]['BOLD'] == 'True') {
                    this.box.checked = true
                } else {
                    this.box.checked = false
                }

                this.box.onclick = (evt) => {
                    evt.stopPropagation();

                    if (this.box.checked) {
                        this.parentRow.parentTable.data[this.parentRow.nRow]['BOLD'] = 'True';
                        this.parentRow.items['TOKEN'].bold = true
                    }
                    else {
                        this.parentRow.parentTable.data[this.parentRow.nRow]['BOLD'] = 'False';
                        this.parentRow.items['TOKEN'].bold = false
                    }

                    this.parentRow.parentTable.update()
                }
            }

            boldItem.fill = boldItemFill
            boldItem.setOnClick(() => boldItem.box.click());
            boldItem.setSimpleCombo('enter', () => boldItem.box.click());

            let italicItem = new TableItem(row.data['ITALIC'], 'ITALIC', row, true);
            row.addItem('ITALIC', italicItem);

            let italicItemFill = function () {
                this.clear();

                this.box = document.createElement('input');
                this.box.type = "checkbox";
                this.element.append(this.box);

                if (this.parentRow.parentTable.data[this.parentRow.nRow]['ITALIC'] == 'True') {
                    this.box.checked = true
                } else {
                    this.box.checked = false
                }

                this.box.onclick = (evt) => {
                    evt.stopPropagation();

                    if (this.box.checked) {
                        this.parentRow.parentTable.data[this.parentRow.nRow]['ITALIC'] = 'True';
                        this.parentRow.items['TOKEN'].italic = true
                    }
                    else {
                        this.parentRow.parentTable.data[this.parentRow.nRow]['ITALIC'] = 'False';
                        this.parentRow.items['TOKEN'].italic = false
                    }

                    this.parentRow.parentTable.update()
                }
            }

            italicItem.fill = italicItemFill;
            italicItem.setOnClick(() => italicItem.box.click());
            italicItem.setSimpleCombo('enter', () => italicItem.box.click());

            let letterspacedItem = new TableItem(row.data['LETTERSPACED'], 'LETTERSPACED', row, true);
            row.addItem('LETTERSPACED', letterspacedItem);

            let letterspacedItemFill = function () {
                this.clear();

                this.box = document.createElement('input');
                this.box.type = "checkbox";
                this.element.append(this.box);

                if (this.parentRow.parentTable.data[this.parentRow.nRow]['LETTERSPACED'] == 'True') {
                    this.box.checked = true
                } else {
                    this.box.checked = false
                }

                this.box.onclick = (evt) => {
                    evt.stopPropagation();

                    if (this.box.checked) {
                        this.parentRow.parentTable.data[this.parentRow.nRow]['LETTERSPACED'] = 'True';
                        this.parentRow.items['TOKEN'].letterspaced = true
                    }
                    else {
                        this.parentRow.parentTable.data[this.parentRow.nRow]['LETTERSPACED'] = 'False';
                        this.parentRow.items['TOKEN'].letterspaced = false
                    }

                    this.parentRow.parentTable.update()
                }
            }

            letterspacedItem.fill = letterspacedItemFill
            letterspacedItem.setOnClick(() => letterspacedItem.box.click());
            letterspacedItem.setSimpleCombo('enter', () => letterspacedItem.box.click());

            Object.entries(row.items).forEach(([field, item]) => {
                item.setOnMouseOver((event) => {
                    if (!this.beingEdited) {
                        event.target.focus()
                    }
                });
                item.fill()
            });

            row.setSequenceCombo(
                'l g',
                () => {
                    this.data[row.nRow]['LANG'] = 'German';
                    this.sanitize();
                    this.notifyChange();
                    this.update()
                }
            );
            row.setSequenceCombo(
                'l p',
                () => {
                    this.data[row.nRow]['LANG'] = 'Portuguese';
                    this.sanitize();
                    this.notifyChange();
                    this.update()
                }
            );
            row.setSequenceCombo(
                'l e',
                () => {
                    this.data[row.nRow]['LANG'] = 'English';
                    this.sanitize();
                    this.notifyChange();
                    this.update()
                }
            );

            row.setSequenceCombo(
                'f a',
                () => {
                    this.data[row.nRow]['FONT-FAMILY'] = 'Antiqua';
                    this.sanitize();
                    this.notifyChange();
                    this.update()
                }
            );
            row.setSequenceCombo(
                'f s',
                () => {
                    this.data[row.nRow]['FONT-FAMILY'] = 'Script';
                    this.sanitize();
                    this.notifyChange();
                    this.update()
                }
            );
            row.setSequenceCombo(
                'f g',
                () => {
                    this.data[row.nRow]['FONT-FAMILY'] = 'Gothic';
                    this.sanitize();
                    this.notifyChange();
                    this.update()
                }
            );
            row.setSequenceCombo(
                'f f',
                () => {
                    this.data[row.nRow]['FONT-FAMILY'] = 'Fraktur';
                    this.sanitize();
                    this.notifyChange();
                    this.update()
                }
            );
            row.setSequenceCombo(
                'f v',
                () => {
                    this.data[row.nRow]['FONT-FAMILY'] = 'Fraktur-Variant';
                    this.sanitize();
                    this.notifyChange();
                    this.update()
                }
            );

            row.setSequenceCombo(
                'b l',
                () => {
                    this.data[row.nRow]['BOLD'] = this.data[row.nRow]['BOLD'] === 'True' ? 'False' : 'True';
                    this.sanitize();
                    this.notifyChange();
                    this.update()
                }
            );

            row.setSequenceCombo(
                'i t',
                () => {
                    this.data[row.nRow]['ITALIC'] = this.data[row.nRow]['ITALIC'] === 'True' ? 'False' : 'True';
                    this.sanitize();
                    this.notifyChange();
                    this.update()
                }
            );

            row.setSequenceCombo(
                'l s',
                () => {
                    this.data[row.nRow]['LETTERSPACED'] = this.data[row.nRow]['LETTERSPACED'] === 'True' ? 'False' : 'True';
                    this.sanitize();
                    this.notifyChange();
                    this.update()
                }
            );

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
            row.nRow = nRow;

            Object.entries(row.items).forEach(([field, item]) => {
                // if (field === 'LOCATION') {
                //     item.data = nRow.toString()
                // }
                // else {
                    if (field === 'TOKEN') {
                        if (row.data['FONT-FAMILY'] === 'Fraktur') {
                            item.fontFamily = "UnifrakturMaguntia";
                            // item.fontSize = 15
                        }
                        else {
                            item.fontFamily = "AletheiaSans";
                            // item.fontSize = 12
                        }
                        item.fontSize = 15;

                        if (row.data['BOLD'] == 'True') {
                            item.bold = true
                        }
                        else {
                            item.bold = false
                        }

                        if (row.data['ITALIC'] == 'True') {
                            item.italic = true
                        }
                        else {
                            item.italic = false
                        }

                        if (row.data['LETTERSPACED'] == 'True') {
                            item.letterspaced = true
                        }
                        else {
                            item.letterspaced = false
                        }
                    }
                    item.data = row.data[field]
                // }
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
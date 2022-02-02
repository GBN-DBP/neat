
function loadFile(evt, onComplete) {

    let file = evt.target.files[0];

    let urls = null;

    let reader = new FileReader();

    reader.onload =
        function(event) {

            let link_detector = /(https?:\/\/[^\s]+)/g;

            let lines = event.target.result.split(/\r\n|\n/);
            for(let i = 0; i < lines.length; i++){

                let line = lines[i];

                if (!line.startsWith('#')) continue;

                let tmp = line.match(link_detector);

                if (tmp == null) continue;

                if (urls == null) {
                    urls = tmp;
                }
                else {
                    urls.push(tmp[0])
                }
            };
        };

    reader.readAsText(file);

    Papa.parse(file, {
        header: true,
        delimiter: '\t',
        quoteChar: String.fromCharCode(0),
	    escapeChar: String.fromCharCode(0),
        comments: "#",
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: function(results) { onComplete(results, file, urls); }
    });
}

function setupInterface(data, file, urls) {

    if (data.data.length <= 0) {
        let empty_html = `
            File is empty.
            <a href="neat.html"> Load another one.</a>
        `;

        $('#tableregion').html(empty_html);
        return null;
    }

    // private variables of app

    let has_changes = false;

    let save_timeout = null;

    let wnd_listener = new window.keypress.Listener();

    let displayRows = 15;
    let startIndex = 0;
    let previewBounds = {
        minLeft: 1000000000,
        maxRight: 0,
        minTop: 1000000000,
        maxBottom: 0
    };

    let table;

    let slider_pos = data.data.length - startIndex;
    let slider_min = displayRows;
    let slider_max = data.data.length;

    // private functions of app

    function notifyChange() {
        if (save_timeout != null) clearTimeout(save_timeout);
        has_changes = true;

        $("#save").attr('disabled', false);
    }

    function resetChanged() {
        if (save_timeout != null) clearTimeout(save_timeout);

        $("#save").attr('disabled', true);
        has_changes = false;
    }

    function checkForSave (csv) {

        if (save_timeout != null) clearTimeout(save_timeout);

        // This is a work-around that checks if the user actually saved the file or if the save dialog was cancelled.
        let counter = 0;
        let checker =
            function() {
                console.log('checker ...', counter);

                if (counter > 20) return;

                let reader = new FileReader();

                reader.onload =
                    function(event) {

                        let content = event.target.result;

                        if (content == csv) { // ok content of the file is actually equal to desired content.
                            console.log('Save success ...');
                            resetChanged();
                            return;
                        }

                        counter++;
                        save_timeout = setTimeout(checker, 3000);
                    };

                reader.readAsText(file);
            };

        save_timeout = setTimeout(checker, 3000);
    };

    function saveFile(evt) {

        let csv =
            Papa.unparse(data,
                {
                    header: true,
                    delimiter: '\t',
                    comments: "#",
                    quoteChar: String.fromCharCode(0),
                    escapeChar: String.fromCharCode(0),
                    skipEmptyLines: true,
                    dynamicTyping: true
                });

        let lines = csv.split(/\r\n|\n/);

        csv = [ lines[0] ];
        let url_id = -1;

        for(let i = 0; i < data.data.length; i++){
            if (data.data[i]['url_id'] > url_id) {

                url_id = data.data[i]['url_id'];

                if (urls != null)
                    csv.push("# " + urls[url_id]);
            }
            csv.push(lines[i+1]);
        }

        csv = csv.join('\n');

        openSaveFileDialog (csv, file.name, null);

        checkForSave(csv);
    }

    function openSaveFileDialog (data, filename, mimetype) {

        if (!data) return;

        let blob = data.constructor !== Blob
          ? new Blob([data], {type: mimetype || 'application/octet-stream'})
          : data ;

        if (navigator.msSaveBlob) {
          navigator.msSaveBlob(blob, filename);
          return;
        }

        let lnk = document.createElement('a'),
            url = window.URL,
            objectURL;

        if (mimetype) {
          lnk.type = mimetype;
        }

        lnk.download = filename || 'untitled';
        lnk.href = objectURL = url.createObjectURL(blob);
        lnk.dispatchEvent(new MouseEvent('click'));
        setTimeout(url.revokeObjectURL.bind(url, objectURL));
    }

    function init() {

        $("#tableregion").empty();

        $("#btn-region").empty();

        $("#file-region").empty();

        $("#region-right").empty();

        let range_html =
                `
                <input type="range" orient="vertical" class="form-control-range"
                    style="-webkit-appearance: slider-vertical;height:100%;outline: 0 none !important;"
                    min="${slider_min}" max="${slider_max}" value="${slider_pos}" id="docpos" />
                `;

        $("#region-right").html(range_html)

        $("#docpos").change(
            function(evt) {

                if (table.beingEdited) {
                    table.beingEdited.finish(true);
                }

                if (table.startIndex == data.data.length - this.value) return;

                table.startIndex = data.data.length - this.value;
                table.endIndex = table.startIndex + table.displayRows;

                table.update();
            });

        $('#docpos').slider();

        let save_html =
            `<button class="btn btn-primary saveButton" id="save" disabled tabindex="-1">Save Changes</button>`;

        $("#btn-region").html(save_html);

        $("#save").attr('disabled', !has_changes);

        let parts = file.name.split(/(?=[\.|\-|_])/);

        let heading = parts.join("&shy;")

        $("#file-region").html('<h3>' + heading + '</h3>');

        $('.saveButton').on('click', saveFile);

        $('#table').on('click',
            function(event) {

                let target = event.target.closest('.editable');

                if (target == null) return;

                if (table.beingEdited) {

                    if (target == $(':focus')) return;
                    if ($.contains($(':focus')[0], target)) return;
                    if ($.contains(target, $(':focus')[0])) return;
                    if ($.contains($('.simple-keyboard')[0], event.target)) return;

                    let refocus = $(':focus');

                    table.beingEdited.finish(true);

                    refocus.focus();

                }

                if (!$.contains($('#table')[0], target)) return

                $(target).data('tableInfo').clickAction(target);
            });

        let previewRgn = $('#preview-rgn')[0];
        let sliderRgn = $('#docpos')[0];
        let keyboardRgn = $('.simple-keyboard')[0];

        table = new FontsTable(
            data.data,
            startIndex,
            displayRows,
            previewBounds,
            previewRgn,
            sliderRgn,
            keyboardRgn,
            urls,
            notifyChange,
            wnd_listener
        );

        table.element.append(document.createElement('br'));
        table.element.append(document.createElement('br'));

        $("#tableregion").html(table.element);
    }

    $('#tableregion')[0].addEventListener("wheel",
        function(event) {

            if (table.beingEdited) return;

            if (event.deltaY < 0) table.stepsBackward(1);
            else table.stepsForward(1);
        });

    wnd_listener.simple_combo('tab',
        function () {
            if (table.beingEdited)
                return false; // If we are in editing mode, we do not want to propagate the TAB event.
            else return true; // In non-editing mode, we want to get the "normal" tab behaviour.
        });

    wnd_listener.simple_combo('pageup',
        function() {
            if (table.beingEdited) return;

            $('#back').click();
        });

    wnd_listener.simple_combo('pagedown',
        function() {
            if (table.beingEdited) return;

            $('#next').click();
        });

    wnd_listener.simple_combo('left',
        function() {
            if (table.beingEdited) return;

            let prev = $(':focus').prev('.editable')

            if (prev.length==0) {
                $(':focus').closest('tr').prev('tr').children('.editable').last().focus();
            }
            else {
                prev.focus();
            }
        });
    wnd_listener.simple_combo('right',
        function() {
            if (table.beingEdited) return;

            let next = $(':focus').next('.editable')

            if (next.length==0) {
                $(':focus').closest('tr').next('tr').children('.editable').first().focus();
            }
            else {
                next.focus();
            }
        });

     wnd_listener.register_combo(
        {
            keys: 'meta up',
            on_keydown:
                function() {
                    if (table.beingEdited) return;

                    table.stepsBackward(1);
                },
            is_solitary: true
        }
    );

     wnd_listener.register_combo(
        {
            keys: 'up',

            on_keydown:
                function() {
                    if (table.beingEdited) return;

                    let prev = $(':focus').closest('tr').prev('tr')

                    let pos = $(':focus').closest('tr').children('.editable').index($(':focus'))

                    if (prev.length==0) {
                        table.stepsBackward(1);
                    }
                    else {
                        prev.children('.editable')[pos].focus();
                    }
                },
            is_solitary : true
        });

    wnd_listener.register_combo(
        {
            keys: 'meta down',

            on_keydown: function() {
                if (table.beingEdited) return;

                table.stepsForward(1);
            },
            is_solitary: true
        }
    );

    wnd_listener.register_combo(
        {
        keys : 'down',
        on_keydown:
            function() {
                if (table.beingEdited) return;

                let next = $(':focus').closest('tr').next('tr')

                let pos = $(':focus').closest('tr').children('.editable').index($(':focus'))

                if (next.length==0) {
                    table.stepsForward(1);
                }
                else {
                    next.children('.editable')[pos].focus();
                }
            },
        is_solitary: true,
        }
    );


    wnd_listener.sequence_combo('l a',
        function() {
            if (table.beingEdited) return;

            table.displayRows++;

            table.endIndex = table.startIndex + table.displayRows;

            if (table.endIndex >= data.data.length) {
                table.startIndex = data.data.length - table.displayRows;
                table.endIndex = data.data.length;
            }

            slider_min = table.displayRows;
            slider_max = data.data.length;

            init();
        });

    wnd_listener.sequence_combo('l r',
        function() {
            if (table.beingEdited) return;

            if (table.displayRows > 5) table.displayRows--;

            table.endIndex = table.startIndex + table.displayRows;
            slider_min = table.displayRows;
            slider_max = data.data.length;

            init();
        });

    // public interface
    let that =
        {
            hasChanges: function () { return has_changes; }
        };

    init();

    return that;
}


$(document).ready(
    function() {

        $('#tsv-file').change(
            function(evt) {

                loadFile ( evt,
                    function(results, file, urls) {

                        let neat = setupInterface(results, file, urls);

                        $(window).bind("beforeunload",
                            function() {

                                console.log(neat.hasChanges());

                                if (neat.hasChanges())
                                    return confirm("You have unsaved changes. Do you want to save them before leaving?");
                            }
                        );
                    })
            }
        );
    }
);

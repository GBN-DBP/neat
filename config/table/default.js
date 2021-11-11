let displayRows=15
let startIndex=0;
let endIndex=displayRows;

let editableCols = new Set(['TOKEN', 'TEXT', 'ID']);
let tokenCols = new Set(['TOKEN', 'TEXT']);
let linkCols = new Set(['ID']);
let tagCols = new Set(['NE-TAG', 'NE-EMB']);
let hiddenCols = new Set(['url_id', 'left', 'right', 'top', 'bottom', 'ocrconf', 'conf']);
let urlIdCols = new Set(['url_id']);
let coordCols = new Set(['left', 'right', 'top', 'bottom']);
let confCols = new Set(['ocrconf', 'conf']);

let tagClasses = 'ner_per ner_loc ner_org ner_work ner_conf ner_evt ner_todo';
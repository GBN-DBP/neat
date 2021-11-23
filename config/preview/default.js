function updatePreview(row, urls, bounds) {
    if (urls == null) return;

    let img_url = urls[row['url_id']];

    if (img_url == "http://empty")
        return

    let raw_left = parseInt(row['left']);
    let raw_right = parseInt(row['right']);
    let raw_top = parseInt(row['top']);
    let raw_bottom = parseInt(row['bottom']);

    let left = raw_left;
    let right = raw_right;
    let top = raw_top;
    let bottom = raw_bottom;

    let raw_width = right - left;
    let raw_height = bottom - top;


    top = Math.max(0, top - 25);
    bottom = Math.min(bounds.maxBottom, bottom + 25);

    left = Math.max(0, left - 50);
    right = Math.min(bounds.maxRight, right + 50);

    width = right - left;
    height = bottom - top;

    img_url = img_url.replace('left',  left.toString());
    img_url = img_url.replace('right', right.toString());
    img_url = img_url.replace('top',   top.toString());
    img_url = img_url.replace('bottom',bottom.toString());
    img_url = img_url.replace('width', width.toString());
    img_url = img_url.replace('height', height.toString());

    let offscreen= document.createElement('canvas');
    offscreen.width= width;
    offscreen.height= height;

    $("#preview").attr("src", offscreen.toDataURL());

    let ctx = offscreen.getContext("2d");
    let img = new Image();
    img.crossOrigin = "anonymous";

    (function(left,top) {
        img.onload = function() {
                ctx.drawImage(img, 0, 0);
                ctx.beginPath();
                ctx.lineWidth = "1";
                ctx.strokeStyle = "red";
                ctx.rect(raw_left - left, raw_top - top, raw_width, raw_height);
                ctx.stroke();

                $("#preview").attr("src", offscreen.toDataURL());
            };
    })(left, top);

    img.src = img_url;

    top = Math.max(0, top - 200);
    bottom = Math.min(bounds.maxBottom, bottom + 200);

    left = Math.max(0, left - 400);
    right = Math.min(bounds.maxRight, right + 400);

    width = right - left;
    height = bottom - top;

    let highlight = "?highlight=left,top,width,height&highlightColor=ff0000";
    highlight = highlight.replace(/left/g,  (raw_left -left).toString());
    highlight = highlight.replace(/top/g,   (raw_top - top).toString());
    highlight = highlight.replace(/width/g, raw_width.toString());
    highlight = highlight.replace(/height/g, raw_height.toString());

    let enlarge_img_url = urls[row['url_id']] + highlight;

    enlarge_img_url = enlarge_img_url.replace(/left/g,  left.toString());
    enlarge_img_url = enlarge_img_url.replace(/right/g, right.toString());
    enlarge_img_url = enlarge_img_url.replace(/top/g,   top.toString());
    enlarge_img_url = enlarge_img_url.replace(/bottom/g,bottom.toString());
    enlarge_img_url = enlarge_img_url.replace(/width/g, width.toString());
    enlarge_img_url = enlarge_img_url.replace(/height/g, height.toString());

    //?highlight=left,top,width,height&highlightColor=ff0000

    if ($('#enlarge-page-link').length == 0) {
        let enlarge_html =
        `
            <a href="" id="enlarge-page-link" target="_blank" rel="noopener noreferrer"><small>enlarge</small> </a>
        `;

        $('#preview-rgn').append($(enlarge_html));
    }

    $("#preview-link").attr("href", enlarge_img_url);
    $("#enlarge-page-link").attr("href", enlarge_img_url);

    highlight = "?highlight=left,top,width,height&highlightColor=ff0000";
    highlight = highlight.replace(/left/g,  raw_left.toString());
    highlight = highlight.replace(/top/g,   raw_top.toString());
    highlight = highlight.replace(/width/g, raw_width.toString());
    highlight = highlight.replace(/height/g, raw_height.toString());

    full_img_url = urls[row['url_id']] + highlight;

    width = bounds.maxRight - bounds.minLeft;
    height = bounds.maxBottom - bounds.minTop;

    full_img_url = full_img_url.replace("left,top,width,height", "full")
    full_img_url = full_img_url.replace("left,right,top,bottom", "full")
    full_img_url = full_img_url.replace("left,top,right,bottom", "full")

    full_img_url = full_img_url.replace(/left/g,  bounds.minLeft.toString());
    full_img_url = full_img_url.replace(/right/g, bounds.maxRight.toString());
    full_img_url = full_img_url.replace(/top/g,   bounds.minTop.toString());
    full_img_url = full_img_url.replace(/bottom/g, bounds.maxBottom.toString());
    full_img_url = full_img_url.replace(/width/g, width.toString());
    full_img_url = full_img_url.replace(/height/g, height.toString());

    if ($('#full-page-link').length == 0) {
        $('#preview-rgn').append($('<small>| </small><a href="" id="full-page-link" target="_blank" rel="noopener noreferrer"><small>full</small> </a>'));
    }

    $("#full-page-link").attr("href", full_img_url);
}
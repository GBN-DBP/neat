function updatePreview(row, urls, bounds) {
    if (urls == null) return;

    let img_url = urls[row['url_id']];

    if (img_url == "http://empty") {
        return
    }

    let offscreen = document.createElement('canvas');

    // word coordinates
    let word_left = parseInt(row['left']);
    let word_right = parseInt(row['right']);
    let word_top = parseInt(row['top']);
    let word_bottom = parseInt(row['bottom']);

    let word_width = word_right - word_left;
    let word_height = word_bottom - word_top;

    // let scale_factor = .32;
    let scale_factor = (30 * (96 / 72)) / word_height;

    let scaled_word_left = Math.floor(word_left * scale_factor);
    let scaled_word_top = Math.floor(word_top * scale_factor);
    let scaled_word_width = Math.floor(word_width * scale_factor);
    let scaled_word_height = Math.floor(word_height * scale_factor);

    // tile coordinates
    let scaled_tile_width = offscreen.width;
    let scaled_tile_height = 2 * scaled_word_height;

    let tile_width = Math.floor(scaled_tile_width / scale_factor);
    let tile_height = Math.floor(scaled_tile_height / scale_factor);

    let width_offset = Math.floor((tile_width - word_width) / 2);
    let height_offset = Math.floor((tile_height - word_height) / 2);

    let tile_left = Math.max(0, word_left - width_offset);
    let tile_top = Math.max(0, word_top - height_offset);

    let scaled_tile_left = Math.floor(tile_left * scale_factor);
    let scaled_tile_top = Math.floor(tile_top * scale_factor);


    // highlight coordinates
    let highlight_offset = 5;

    let highlight_left = Math.max(0, scaled_word_left - scaled_tile_left - highlight_offset);
    let highlight_top = Math.max(0, scaled_word_top - scaled_tile_top - highlight_offset);
    let highlight_width = scaled_word_width + 2 * highlight_offset;
    let highlight_height = scaled_word_height + 2 * highlight_offset;


    img_url = img_url.replace('left', tile_left.toString());
    img_url = img_url.replace('top', tile_top.toString());
    img_url = img_url.replace('width', tile_width.toString());
    img_url = img_url.replace('height', tile_height.toString());

    img_url = img_url.replace('full', "," + scaled_tile_height.toString());

    offscreen.height = scaled_tile_height;

    $("#preview").attr("src", offscreen.toDataURL());

    let ctx = offscreen.getContext("2d");
    let img = new Image();
    img.crossOrigin = "anonymous";

    (function(left, top) {
        img.onload = function() {
                ctx.drawImage(img, 0, 0);
                ctx.beginPath();
                ctx.fillStyle = "#f0e4425f";
                ctx.fillRect(highlight_left, highlight_top, highlight_width, highlight_height);

                $("#preview").attr("src", offscreen.toDataURL());
            };
    })(tile_left, tile_top);

    img.src = img_url;

    full_img_url = urls[row['url_id']];

    full_img_url = full_img_url.replace("left,top,width,height", "full")
    full_img_url = full_img_url.replace("left,right,top,bottom", "full")
    full_img_url = full_img_url.replace("left,top,right,bottom", "full")

    if ($('#full-page-link').length == 0) {
        $('#preview-rgn').append($('<a href="" id="full-page-link" target="_blank" rel="noopener noreferrer"><small>full</small> </a>'));
    }

    $("#full-page-link").attr("href", full_img_url);
}
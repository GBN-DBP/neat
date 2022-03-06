function updatePreview(row, urls, bounds) {
    if (urls == null) return;

    let img_url = urls[row['url_id']];

    if (img_url == "http://empty") {
        return
    }

    let offscreen = document.createElement('canvas');

    let word_region = row['region'];

    if (word_region == 'full') {
        let info_url = img_url + '/' + 'info.json';

        $.getJSON(info_url, (info) => {
            let angle = parseFloat(row['rotation']) * (Math.PI / 180.0);

            let half_width = info.width / 2.0;
            let half_height = info.height / 2.0;

            let radius = Math.floor(Math.sqrt(Math.pow(half_width, 2) + Math.pow(half_height, 2)));

            let center = {
                x: radius,
                y: radius
            };

            let top_left = {
                x: center.x - half_width,
                y: center.y - half_height
            };
            let top_right = {
                x: center.x + half_width,
                y: center.y - half_height
            };
            let bottom_left = {
                x: center.x - half_width,
                y: center.y + half_height
            };
            let bottom_right = {
                x: center.x + half_width,
                y: center.y + half_height
            };

            let rotated_top_left = {
                x: center.x + (top_left.x-center.x)*Math.cos(angle) + (top_left.y-center.y)*Math.sin(angle),
                y: center.y - (top_left.x-center.x)*Math.sin(angle) + (top_left.y-center.y)*Math.cos(angle)
            };
            let rotated_top_right = {
                x: center.x + (top_right.x-center.x)*Math.cos(angle) + (top_right.y-center.y)*Math.sin(angle),
                y: center.y - (top_right.x-center.x)*Math.sin(angle) + (top_right.y-center.y)*Math.cos(angle)
            };
            let rotated_bottom_left = {
                x: center.x + (bottom_left.x-center.x)*Math.cos(angle) + (bottom_left.y-center.y)*Math.sin(angle),
                y: center.y - (bottom_left.x-center.x)*Math.sin(angle) + (bottom_left.y-center.y)*Math.cos(angle)
            };
            let rotated_bottom_right = {
                x: center.x + (bottom_right.x-center.x)*Math.cos(angle) + (bottom_right.y-center.y)*Math.sin(angle),
                y: center.y - (bottom_right.x-center.x)*Math.sin(angle) + (bottom_right.y-center.y)*Math.cos(angle)
            };

            let min = {
                x: Math.min(rotated_top_left.x, rotated_top_right.x, rotated_bottom_left.x, rotated_bottom_right.x),
                y: Math.min(rotated_top_left.y, rotated_top_right.y, rotated_bottom_left.y, rotated_bottom_right.y)
            };
            let max = {
                x: Math.max(rotated_top_left.x, rotated_top_right.x, rotated_bottom_left.x, rotated_bottom_right.x),
                y: Math.max(rotated_top_left.y, rotated_top_right.y, rotated_bottom_left.y, rotated_bottom_right.y)
            };

            let canvas_width = $("#region-left").width();

            offscreen.width = canvas_width;
            offscreen.height = canvas_width;

            let scale_factor = canvas_width / (2.0 * radius);

            let img_width = Math.floor(info.width * scale_factor);
            let img_height = Math.floor(info.height * scale_factor);

            let size = img_width.toString() + ',' + img_height.toString();

            img_url = img_url + '/' + word_region;      // region
            img_url = img_url + '/' + size;             // size
            img_url = img_url + '/' + row['rotation'];  // rotation
            img_url = img_url + '/' + 'gray';           // quality
            img_url = img_url + '.' + 'jpg';            // format

            // $("#preview").attr("src", offscreen.toDataURL());

            // let ctx = offscreen.getContext("2d");
            // let img = new Image();
            // img.crossOrigin = "anonymous";

            // img.onload = function() {
            //     let x = Math.floor(min.x * scale_factor);
            //     let y = Math.floor(min.y * scale_factor);

            //     ctx.drawImage(img, x, y);
            //     ctx.beginPath();

            //     let p = 10;

            //     for (let x = 0; x <= canvas_width; x += 60) {
            //         ctx.moveTo(0.5 + x + p, p);
            //         ctx.lineTo(0.5 + x + p, canvas_width + p);
            //     }
            //     for (let y = 0; y <= canvas_width; y += 60) {
            //         ctx.moveTo(p, 0.5 + y + p);
            //         ctx.lineTo(canvas_width + p, 0.5 + y + p);
            //     }
            //     ctx.strokeStyle = "#f0e442";
            //     ctx.stroke();

            //     $("#preview").attr("src", offscreen.toDataURL());
            // };

            // img.src = img_url

            map.eachLayer((layer) => {
                map.removeLayer(layer)
            });

            L.tileLayer.iiif(
                info_url,
                {
                    // region: word_region,
                    // size: size,
                    rotation: row['rotation'],
                    quality: 'gray',
                    tileFormat: 'png',
                    // tileSize: 4096
                }
            ).addTo(map)
        })
    }
    else {
        word_region = row['region'].split(',');

        // word coordinates
        let word_left = parseInt(word_region[0]);
        let word_top = parseInt(word_region[1]);
        let word_width = parseInt(word_region[2]);
        let word_height = parseInt(word_region[3]);

        // let scale_factor = .32;
        let scale_factor = (20 * (96 / 72)) / word_height;

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

        let tile_region = tile_left.toString() + ',' + tile_top.toString() + ',' + tile_width.toString() + ','
                        + tile_height.toString();

        img_url = img_url.replace('region', tile_region);
        img_url = img_url.replace('size', "," + scaled_tile_height.toString());
        img_url = img_url.replace('rotation', row['rotation']);
        img_url = img_url.replace('quality', 'gray');
        img_url = img_url.replace('format', 'jpg');

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

        full_img_url = full_img_url.replace('region', row['full_region']);
        full_img_url = full_img_url.replace('size', 'full');
        full_img_url = full_img_url.replace('rotation', row['full_rotation']);
        full_img_url = full_img_url.replace('quality', 'default');
        full_img_url = full_img_url.replace('format', 'jpg');

        if ($('#full-page-link').length == 0) {
            $('#preview-rgn').append($('<a href="" id="full-page-link" target="_blank" rel="noopener noreferrer"><small>full</small> </a>'));
        }

        $("#full-page-link").attr("href", full_img_url)
    }
}
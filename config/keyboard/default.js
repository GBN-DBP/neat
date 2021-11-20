class Keyboard {
    constructor(table, textArea) {
        this.textArea = textArea;
        this.listener = new window.keypress.Listener($('#simple-keyboard'), table.listener_defaults);

        this.listener.simple_combo('enter', () => table.finish(true));
        this.listener.simple_combo('esc', () => table.finish(false));
        this.listener.simple_combo('ctrl', this.toggleLayout.bind(this));

        this.layout = new window.SimpleKeyboard.default({
            onChange: (input) => this.textArea.value = input,
            layout: {
                'default': [
                    "\uF1AC \u00AD \u00AC \u00BD \u00C0 \u00C3 \u00C4 \u00C6 \u00E0 \u00E3 \u00E4 \u00E6 \u0101 \u023A \u2C65 \uE42C",
                    "\uEFA1 \uF500 \uF532 \u0253 \uF524 \u00C7 \u00E7 \u0107 \uEEC4 \uEEC5 \uF501 \uF502 \uF517 \uF520 \uF522 \uF531",
                    "\uF50A \uF51B \u00C8 \u00C9 \u00CB \u00E8 \u00E9 \u00EB \u0113 \u0118 \u0119 \u0256 \u0247 \u1EBD \u204A \uE4E1",
                    "\uF158 \uF219 \uF515 \uFB00 \uFB01 \uFB02 \uFB03 \uA7A0 \uA7A1 \uF504 \uF505 \uF506 \uF521 \uF525 \u00CD \u00ED",
                    "\u00EF \u0129 \u012B \u0133 \uA76D \uF220 \uF533 \uEBE3 \uA742 \uA743 \uA7A2 \uA7A3 \u0141 \u0142 \uF4F9 \uF50B",
                    "\uE5B8 \uF519 \u00D1 \u00F1 \uA7A4 \uA7A5 \uE1DC \uE5DC \u00D2 \u00D5 \u00D6 \u00D8 \u00F2 \u00F5 \u00F6 {bksp}"
                ],
                'layout1': [
                    "\u00F8 \u014D \u0153 \uE644 \uA750 \uA751 \uA752 \uA753 \uE665 \uEED6 \uEED7 \uF51F \uF526 \uF529 \uA756 \uA757",
                    "\uA759 \uE282 \uE681 \uE682 \uE68B \uE8BF \uF508 \uF509 \uF50C \uF50D \uF50E \uF50F \uF51A \uF523 \uF52F \uF535",
                    "\u211F \uA75C \uA75D \uA7A6 \uA7A7 \uF510 \uF518 \uF536 \u00DF \u017F \u1E9C \u1E9E \uEADA \uEBA2 \uEBA3 \uEBA6",
                    "\uEBA7 \uEBAC \uF4FC \uF4FF \uF511 \uF51E \uF528 \uF52C \uFB06 \uE6E2 \uEEDC \uF512 \uF537 \u00D9 \u00DC \u00F9",
                    "\u00FC \u0169 \u016B \u016D \u016E \u016F \uA770 \uE72B \uF1A5 \uF1A6 \uF534 \uE73A \uE8BA \uF513 \uF527 \uF514",
                    "\u1EF9 \uE781 \uF52A \uF52B \u017C \u017D \u017E \uF516 \uF51D \u1F51 \u2042 \u2184 \u2234 \u261c \u261E \u2767",
                    "\u2010 \u2011 \u2E17 \uF161 \uF51C \uF52D \uF538 \uFFFD \uA75B {bksp}"
                ]
            }
        });

        this.layout.setInput(this.textArea.value);

        this.textArea.oninput = () => this.layout.setInput(this.textArea.value)
    }

    toggleLayout() {
        let layout_name = this.layout.options.layoutName;
        let layout_toggle = layout_name === "default" ? "layout1" : "default";

        this.layout.setOptions({layoutName: layout_toggle})
    }
}
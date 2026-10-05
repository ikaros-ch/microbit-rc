enum GamepadButtonEvent {
    //% block="pressed"
    Pressed = 1,
    //% block="released"
    Released = 0
}

enum GamepadAxis {
    //% block="x"
    X,
    //% block="y"
    Y
}

/**
 * Inputs from the RC Pad web app (buttons, toggles, sliders, joysticks)
 * and values sent back to its display widgets. Everything goes over the
 * Bluetooth UART service as newline-terminated text lines.
 */
//% color=#7c5cff weight=95 icon="" block="Gamepad"
//% groups='["Inputs", "Display"]'
namespace gamepad {
    const EVT_DOWN = 0x7E01
    const EVT_UP = 0x7E02
    const EVT_CHANGE = 0x7E03

    // widget id -> index into xs/ys; index + 1 is the event value
    let ids: string[] = []
    let xs: number[] = []
    let ys: number[] = []

    function find(list: string[], key: string): number {
        for (let i = 0; i < list.length; i++) if (list[i] == key) return i
        return -1
    }

    function index(id: string): number {
        let i = find(ids, id)
        if (i < 0) {
            ids.push(id)
            xs.push(0)
            ys.push(0)
            i = ids.length - 1
        }
        return i
    }

    // "BA=1", "TT1=0", "SS=42", "AYaw=-80", "JL=-50,30"
    function handle(line: string) {
        const eq = line.indexOf("=")
        if (eq < 2) return
        const kind = line.charAt(0)
        const i = index(line.substr(1, eq - 1))
        const v = line.substr(eq + 1)
        const c = v.indexOf(",")
        const x = parseInt(c < 0 ? v : v.substr(0, c))
        const y = c < 0 ? 0 : parseInt(v.substr(c + 1))
        if (x == xs[i] && y == ys[i]) return
        xs[i] = x
        ys[i] = y
        if (kind == "B") control.raiseEvent(x ? EVT_DOWN : EVT_UP, i + 1)
        control.raiseEvent(EVT_CHANGE, i + 1)
    }

    bluetooth.startUartService()
    bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine), function () {
        handle(bluetooth.uartReadUntil(serial.delimiters(Delimiters.NewLine)))
    })

    // Display channels: latest value per channel, sent at most every 100 ms.
    let outKeys: string[] = []
    let outVals: string[] = []
    let dirty: boolean[] = []

    function put(channel: string, value: string) {
        const i = find(outKeys, channel)
        if (i < 0) {
            outKeys.push(channel)
            outVals.push(value)
            dirty.push(true)
        } else if (outVals[i] != value) {
            outVals[i] = value
            dirty[i] = true
        }
    }

    // The UART characteristic carries at most 20 bytes per packet, and Greek
    // letters are 2 bytes in UTF-8. Cut the line into raw byte chunks; the app
    // reassembles them with a streaming decoder.
    function send(line: string) {
        const buf = Buffer.fromUTF8(line)
        for (let i = 0; i < buf.length; i += 20)
            bluetooth.uartWriteBuffer(buf.slice(i, Math.min(20, buf.length - i)))
    }

    control.inBackground(function () {
        let tick = 0
        while (true) {
            // resend everything every ~2 s so a freshly connected app catches up
            const all = tick++ % 20 == 0
            for (let i = 0; i < outKeys.length; i++) {
                if (all || dirty[i]) {
                    dirty[i] = false
                    send("D" + outKeys[i] + "=" + outVals[i] + "\n")
                }
            }
            basic.pause(100)
        }
    })

    /**
     * Run code when a button in the app is pressed or released.
     * @param id the widget ID set in the app, eg: "A"
     */
    //% blockId=gamepad_on_button block="on gamepad button $id $event"
    //% id.defl="A" group="Inputs" weight=100
    export function onButton(id: string, event: GamepadButtonEvent, handler: () => void) {
        control.onEvent(event == GamepadButtonEvent.Pressed ? EVT_DOWN : EVT_UP, index(id) + 1, handler)
    }

    /**
     * Run code when any widget (button, toggle, slider, joystick) changes value.
     * @param id the widget ID set in the app, eg: "S"
     */
    //% blockId=gamepad_on_change block="on gamepad $id changed"
    //% id.defl="S" group="Inputs" weight=90
    export function onChange(id: string, handler: () => void) {
        control.onEvent(EVT_CHANGE, index(id) + 1, handler)
    }

    /**
     * True while a button is held, or while a toggle switch is on.
     * @param id the widget ID set in the app, eg: "T1"
     */
    //% blockId=gamepad_is_on block="gamepad $id is on"
    //% id.defl="T1" group="Inputs" weight=80
    export function isOn(id: string): boolean {
        return xs[index(id)] != 0
    }

    /**
     * Slider position 0..100, single-axis stick -100..100 (up/right positive), or 0/1 for buttons and toggles.
     * @param id the widget ID set in the app, eg: "S"
     */
    //% blockId=gamepad_value block="gamepad $id value"
    //% id.defl="S" group="Inputs" weight=70
    export function value(id: string): number {
        return xs[index(id)]
    }

    /**
     * Joystick position on one axis, -100..100 (right and up are positive).
     * @param id the widget ID set in the app, eg: "L"
     */
    //% blockId=gamepad_joystick block="gamepad joystick $id $axis"
    //% id.defl="L" group="Inputs" weight=60
    export function joystick(id: string, axis: GamepadAxis): number {
        const i = index(id)
        return axis == GamepadAxis.X ? xs[i] : ys[i]
    }

    /**
     * Show a number on every display widget bound to this channel.
     * @param channel the display channel set in the app, eg: "speed"
     */
    //% blockId=gamepad_show block="gamepad display $channel show $value"
    //% channel.defl="speed" group="Display" weight=50
    export function show(channel: string, value: number) {
        put(channel, "" + value)
    }

    /**
     * Show text (any language, eg Greek) on every display widget bound to this channel.
     * @param channel the display channel set in the app, eg: "msg"
     */
    //% blockId=gamepad_show_text block="gamepad display $channel show text $text"
    //% channel.defl="msg" group="Display" weight=40
    export function showText(channel: string, text: string) {
        put(channel, text.split("\n").join(" "))
    }
}

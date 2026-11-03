# On button

Inputs from the RC Pad web app (buttons, toggles, sliders, joysticks) and values sent back to its display widgets. Everything goes over the Bluetooth UART service as newline-terminated text lines. / //% color=#7c5cff weight=95 icon="" block="Gamepad" //% groups='["Inputs", "Display"]' namespace gamepad { const EVT_DOWN = 0x7E01 const EVT_UP = 0x7E02 const EVT_CHANGE = 0x7E03 // widget id -> index into xs/ys; index + 1 is the event value let ids: string[] = [] let xs: number[] = [] let ys: number[] = [] function find(list: string[], key: string): number { for (let i = 0; i < list.length; i++) if (list[i] == key) return i return -1 } function index(id: string): number { let i = find(ids, id) if (i < 0) { ids.push(id) xs.push(0) ys.push(0) i = ids.length - 1 } return i } // "BA=1", "TT1=0", "SS=42", "AYaw=-80", "JL=-50,30" function handle(line: string) { const eq = line.indexOf("=") if (eq < 2) return const kind = line.charAt(0) const i = index(line.substr(1, eq - 1)) const v = line.substr(eq + 1) const c = v.indexOf(",") const x = parseInt(c < 0 ? v : v.substr(0, c)) const y = c < 0 ? 0 : parseInt(v.substr(c + 1)) if (x == xs[i] && y == ys[i]) return xs[i] = x ys[i] = y if (kind == "B") control.raiseEvent(x ? EVT_DOWN : EVT_UP, i + 1) control.raiseEvent(EVT_CHANGE, i + 1) } bluetooth.startUartService() bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine), function () { handle(bluetooth.uartReadUntil(serial.delimiters(Delimiters.NewLine))) }) // Display channels: latest value per channel, sent at most every 100 ms. let outKeys: string[] = [] let outVals: string[] = [] let dirty: boolean[] = [] function put(channel: string, value: string) { const i = find(outKeys, channel) if (i < 0) { outKeys.push(channel) outVals.push(value) dirty.push(true) } else if (outVals[i] != value) { outVals[i] = value dirty[i] = true } } // The UART characteristic carries at most 20 bytes per packet, and Greek // letters are 2 bytes in UTF-8. Cut the line into raw byte chunks; the app // reassembles them with a streaming decoder. function send(line: string) { const buf = Buffer.fromUTF8(line) for (let i = 0; i < buf.length; i += 20) bluetooth.uartWriteBuffer(buf.slice(i, Math.min(20, buf.length - i))) } control.inBackground(function () { let tick = 0 while (true) { // resend everything every ~2 s so a freshly connected app catches up const all = tick++ % 20 == 0 for (let i = 0; i < outKeys.length; i++) { if (all || dirty[i]) { dirty[i] = false send("D" + outKeys[i] + "=" + outVals[i] + "\n") } } basic.pause(100) } }) /** Run code when a button in the app is pressed or released.

```sig
gamepad.onButton("A", GamepadButtonEvent.Pressed, function () {
    basic.showIcon(IconNames.Heart)
})
```

## Parameters

* **id**: the widget ID set in the app
* **event**: 
* **handler**: 

## Example

```blocks
gamepad.onButton("A", GamepadButtonEvent.Pressed, function () {
    basic.showIcon(IconNames.Heart)
})
```

```package
microbit-rc=github:ikaros-ch/microbit-rc
```

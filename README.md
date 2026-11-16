# micro:bit RC Pad

Control a BBC micro:bit from a phone, tablet or computer over Bluetooth. You don't need a second micro:bit.

It has three parts:

* **The MakeCode extension** (this repo's root): adds an **RC Pad** block category to MakeCode.
* **The web app** (`app/`): a gamepad with buttons, joysticks, switches, sliders and displays. **[Open the app](https://ikaros-ch.github.io/microbit-rc/)**
* **An optional Android app** that opens the same web app full screen, see [Android app](#android-app).

Inspired by [hoverbit-ble](https://github.com/JakobST1n/hoverbit-ble) and
[microbit-gamepad](https://github.com/JakobST1n/microbit-gamepad).

## Quick start

You need a micro:bit (V1 or V2) and a computer, phone or tablet with Bluetooth and **Chrome** or **Edge**. Windows, macOS, ChromeOS, Linux and Android work. iPhones and iPads don't, because their browsers have no Web Bluetooth.

1. Open [makecode.microbit.org](https://makecode.microbit.org) and create a new project.
2. Click **Extensions**, paste `https://github.com/ikaros-ch/microbit-rc` and pick **microbit-rc**. If MakeCode says radio and bluetooth can't be used together, click **Remove radio**.
3. Make this program. It shows a heart while button **A** of the app is held:

   ```blocks
   // Show a heart while button A is held
   rcPad.onButton("A", rcPad.ButtonEvent.Pressed, function () {
       basic.showIcon(IconNames.Heart)
   })
   // Clear the screen when A is released
   rcPad.onButton("A", rcPad.ButtonEvent.Released, function () {
       basic.clearScreen()
   })
   ```

4. Click the gear ⚙ → **Project Settings** and select **No Pairing Required**. Then go back to your code.
5. Click **Download** and copy the program to the micro:bit.
6. Open the **[RC Pad app](https://ikaros-ch.github.io/microbit-rc/)** in Chrome or Edge, press **Connect** and pick your micro:bit.
7. Hold **A** in the app (or press the space bar). The heart shows on the micro:bit.

Prefer a guided version? Open the **[tutorial inside MakeCode](https://makecode.microbit.org/#tutorial:https://github.com/ikaros-ch/microbit-rc/rc-pad-tutorial)** (also in Greek).

### If it doesn't connect

* Check step 4. With another pairing mode the app may connect, but the micro:bit ignores the buttons.
* Only one phone, tablet or browser tab can be connected to a micro:bit at a time. Disconnect the other one first.
* On Windows, if the micro:bit was paired before, open **Settings → Bluetooth & devices**, remove the micro:bit there, and connect again from the app.

## Blocks

Every block takes the **ID** of a widget in the app (or the **channel** of a display). The IDs of the app's default layout are used below.

### on rc pad button

Runs code when a button widget is pressed or released. [Help page](docs/on-button.md)

```sig
rcPad.onButton("A", rcPad.ButtonEvent.Pressed, function () {})
```

### on rc pad changed

Runs code when any widget with that ID changes value. [Help page](docs/on-change.md)

```sig
rcPad.onChange("S", function () {})
```

### rc pad is on

True while a button is held or a toggle switch is on. [Help page](docs/is-on.md)

```sig
rcPad.isOn("T1")
```

### rc pad value

Slider position 0 to 100, single-axis stick -100 to 100, or 0/1 for buttons and toggles. [Help page](docs/value.md)

```sig
rcPad.value("S")
```

### rc pad joystick

Joystick position on one axis, -100 to 100. Right and up are positive. [Help page](docs/joystick.md)

```sig
rcPad.joystick("L", rcPad.Axis.X)
```

### rc pad display show

Shows a number on every display widget set to that channel. [Help page](docs/show.md)

```sig
rcPad.show("speed", 0)
```

### rc pad display show text

Shows text on every display widget set to that channel. [Help page](docs/show-text.md)

```sig
rcPad.showText("msg", "hello")
```

The micro:bit sends display values at most every 100 ms and resends all of them every 2 s, so you can call the display blocks in a fast `forever` loop.

## Examples

Each example uses the widget IDs of the app's default layout.

### Light switch

Toggle **T1** turns a light (an LED with a resistor) on pin P1 on and off, and shows the state on the app's **msg** display.

```blocks
basic.forever(function () {
    // Toggle T1 switches a light on pin P1 and tells the app
    if (rcPad.isOn("T1")) {
        pins.digitalWritePin(DigitalPin.P1, 1)
        rcPad.showText("msg", "lights ON")
    } else {
        pins.digitalWritePin(DigitalPin.P1, 0)
        rcPad.showText("msg", "lights off")
    }
})
```

### Servo on a slider

Slider **S** turns a servo on pin P0, and the **speed** display shows its position.

```blocks
// Slider S (0-100) turns a servo on P0 (0-180 degrees)
rcPad.onChange("S", function () {
    pins.servoWritePin(AnalogPin.P0, rcPad.value("S") * 180 / 100)
    // Show the position on the app's "speed" display
    rcPad.show("speed", rcPad.value("S"))
})
```

### Joystick dot

Joystick **L** moves one LED around the screen.

```blocks
basic.forever(function () {
    basic.clearScreen()
    // Joystick L moves one LED: -100..100 maps to columns and rows 0..4
    led.plot(Math.round(rcPad.joystick("L", rcPad.Axis.X) / 50) + 2, 2 - Math.round(rcPad.joystick("L", rcPad.Axis.Y) / 50))
})
```

### Temperature display

Send the micro:bit temperature to the app's **temp** display once a second.

```blocks
basic.forever(function () {
    // Send the temperature to the app's "temp" display
    rcPad.show("temp", input.temperature())
    basic.pause(1000)
})
```

A demo `.hex` that matches the app's default layout is attached to each [release](https://github.com/ikaros-ch/microbit-rc/releases/latest). It is built from [test.ts](test.ts) with No Pairing Required.

## The app

| Widget | Sends to micro:bit | Bind keyboard / controller |
|---|---|---|
| **Button** | 1 while held, 0 when released | any keys and pad buttons/axes |
| **Toggle switch** | flips between 0 and 1 on each press | any keys and pad buttons |
| **Slider** (linear pot) | 0–100, stays where you leave it | keys/pad buttons move it up or down, analog triggers move it in proportion |
| **Single-axis stick** (drone-style gimbal) | -100 to 100. Springs back to center, or turn spring-back off so it holds position like a throttle stick | +/− bindings: pad sticks are analog, keys move it fully (or ramp it when spring-back is off) |
| **Joystick** (thumbstick) | x, y from -100 to 100, springs back to the center | separate up/down/left/right bindings, pad sticks are analog |
| **Display** | shows data the micro:bit sends as text, bar, graph or lamp | – |

* **Controllers** use the browser Gamepad API (Xbox, PlayStation and most USB/Bluetooth pads). Plug one in and press any button so the browser detects it.
* **Greek / English**: the app follows your browser language, or pick **EN / ΕΛ** in the toolbar. The MakeCode blocks are translated too, so switch MakeCode to Ελληνικά.
* **⟳ Rotate**: turns the whole app 90° per press, so you can hold a phone sideways while the browser stays in portrait (or the other way round). The app remembers your choice.

### Edit the controls

1. Press **Edit** in the toolbar. The controls stop sending and can be moved.
2. **Move** a widget by dragging it. **Resize** it by dragging the handle in its corner.
3. **Add** a widget with the **+ Add…** menu in the toolbar (button, toggle switch, slider, single-axis stick, joystick or display).
4. **Tap** a widget to open its settings:
   * **ID** (or **channel** for a display): the name you use in the MakeCode blocks. English letters, digits and `_`, at most 8 characters.
   * **Label** and **color**: what you see in the app. Labels can be in any language.
   * **+ Bind**: press it, then press a key or a controller button, or move a controller stick. A widget can have several bindings, and touch always works too.
   * A display also has a **mode** (text, bar, graph or lamp), a **min**/**max** range and a **unit**.
   * **Delete widget** removes it.
5. Press **Done** to use the controls again.

Layouts are saved in the browser. Use **Export** / **Import** to back them up or share them as JSON files, and **Reset** to get the default layout back.

## Notes

* **Bluetooth pairing:** the app needs **No Pairing Required** (gear ⚙ → **Project Settings** in MakeCode). The extension doesn't change this setting for you.
* **Bluetooth and radio** can't be used in the same program.
* **Upgrading from v1 of the extension:** v2 of the extension renamed the blocks' code from `gamepad.` to `rcPad.` (and `GamepadButtonEvent`/`GamepadAxis` to `rcPad.ButtonEvent`/`rcPad.Axis`), so it doesn't clash with the `blehid` extension. Fix JavaScript projects by renaming. In v2.1 the blocks also got new internal IDs; if an old block project opens with missing blocks, switch it to JavaScript and back to Blocks.
* The extension uses the Bluetooth UART receive handler, so don't add your own `on bluetooth data received` block.
* IDs and channel names can only use English letters, digits and `_`, with at most 8 characters.
* Texts can be any length, but only English letters, digits and symbols: MakeCode for micro:bit can't store Greek or other non-English letters in text. Long texts are split into 20-byte Bluetooth packets, which the app joins back together.

## Android app

The APK is a [Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity): it opens the site full screen through Chrome. A plain Android WebView can't be used because it doesn't support Web Bluetooth.

* You don't need it: the web app in Chrome does the same. The APK only removes the browser bars.
* **Be careful with APK files.** An APK installed from outside Google Play is not checked by Google, and Android will warn you about it. Only install `rc-pad.apk` from this repo's [release page](https://github.com/ikaros-ch/microbit-rc/releases/latest), and ask a teacher or parent first if the device isn't yours. If you are unsure, use the web app instead.
* To install it, download `rc-pad.apk` from the release page and open it. Android asks you to allow installs from your browser.
* The app always loads the live site, so app updates arrive without a new APK.
* A thin URL bar may show at the top. Hiding it needs a `/.well-known/assetlinks.json` file on `ikaros-ch.github.io` with the APK's signing fingerprint.
* `android/` holds the project. CI builds it on every change and attaches it to each release.

## Protocol

Messages are UTF-8 text lines, ending in `\n`, over the Nordic UART service. A line can span several 20-byte packets, so you can use them from any firmware.

| Direction | Line | Meaning |
|---|---|---|
| app → micro:bit | `B<id>=0\|1` | button |
| app → micro:bit | `T<id>=0\|1` | toggle |
| app → micro:bit | `S<id>=0..100` | slider |
| app → micro:bit | `A<id>=-100..100` | single-axis stick |
| app → micro:bit | `J<id>=<x>,<y>` | joystick, -100..100 |
| micro:bit → app | `D<channel>=<value>` | display data |

The app only sends a widget's value when it changes, and it sends every value again right after connecting.

## Develop

The app has no build step. Serve `app/` with any static server and open it on `localhost`, because Web Bluetooth needs a secure context:

```sh
npx http-server app      # or: python -m http.server -d app
node app/core.test.mjs   # input logic self-check
npx makecode build       # compile the extension + demo
```

Pushing to `main` deploys `app/` to GitHub Pages.

## Learn more

* **[Tutorial: Drive your micro:bit with your phone](https://makecode.microbit.org/#tutorial:https://github.com/ikaros-ch/microbit-rc/rc-pad-tutorial)**: a step-by-step guide inside MakeCode (also in Greek)
* [Bluetooth pairing on the micro:bit](https://makecode.microbit.org/reference/bluetooth/bluetooth-pairing)
* [MakeCode Bluetooth UART reference](https://makecode.microbit.org/reference/bluetooth/start-uart-service)
* [MakeCode events and handlers](https://makecode.microbit.org/blocks/on-start)
* [Gamepad API (for controllers in the app)](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API)

## License

MIT

## Supported targets

* for PXT/microbit

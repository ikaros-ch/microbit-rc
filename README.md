# micro:bit RC Pad

A customizable Bluetooth gamepad for the BBC micro:bit, inspired by
[hoverbit-ble](https://github.com/JakobST1n/hoverbit-ble) and
[microbit-gamepad](https://github.com/JakobST1n/microbit-gamepad).

It has two parts:

* **The web app** (`app/`): runs in Chrome/Edge on a phone, tablet or PC. **[Open the app](https://ikaros-ch.github.io/microbit-rc/)**
* **The MakeCode extension** (this repo's root): adds a **Gamepad** block category to MakeCode.

## Features

| Widget | Sends to micro:bit | Bind keyboard / controller |
|---|---|---|
| **Button** | 1 while held, 0 when released | any keys and pad buttons/axes |
| **Toggle switch** | flips between 0 and 1 on each press | any keys and pad buttons |
| **Slider** (linear pot) | 0–100, stays where you leave it | keys/pad buttons move it up or down, analog triggers move it in proportion |
| **Joystick** (thumbstick) | x, y from -100 to 100, springs back to the center | separate up/down/left/right bindings, pad sticks are analog |
| **Display** | shows data the micro:bit sends as text, bar, graph or lamp | – |

* **Edit mode**: drag widgets anywhere and resize them with the corner handle. Tap one to set its ID, label, color, bindings and display options.
* **Bindings**: press **+ Bind**, then press a key, a controller button or move a stick. You can bind as many inputs to one widget as you like, and touch always works too.
* **Controllers** use the browser Gamepad API (Xbox, PlayStation and most USB/Bluetooth pads). Plug one in and press any button so the browser detects it.
* **Layouts** are saved in the browser. Use **Export** / **Import** to back them up or share them as JSON files.

## MakeCode extension

1. Open [makecode.microbit.org](https://makecode.microbit.org) and create a new project.
2. Go to **Extensions** and paste `https://github.com/ikaros-ch/microbit-rc`.
3. Accept that the extension removes `radio`, because Bluetooth and radio can't run together.

```blocks
gamepad.onButton("A", GamepadButtonEvent.Pressed, function () {
    basic.showIcon(IconNames.Heart)
})
basic.forever(function () {
    gamepad.show("speed", gamepad.value("S"))
    gamepad.showText("msg", gamepad.isOn("T1") ? "lights ON" : "lights off")
    led.plot(Math.round(gamepad.joystick("L", GamepadAxis.X) / 50) + 2, 2 - Math.round(gamepad.joystick("L", GamepadAxis.Y) / 50))
})
```

| Block | What it does |
|---|---|
| `on gamepad button "A" pressed/released` | runs when a button widget goes down or up |
| `on gamepad "S" changed` | runs when any widget with that ID changes |
| `gamepad "T1" is on` | true while a button is held or a toggle is on |
| `gamepad "S" value` | slider position 0–100 (0/1 for buttons and toggles) |
| `gamepad joystick "L" x/y` | -100..100, right and up are positive |
| `gamepad display "speed" show 42` | shows a number on every display widget set to channel `speed` |
| `gamepad display "msg" show text "hi"` | shows text the same way |

The micro:bit sends display values at most every 100 ms and resends all of them every 2 s, so you can call `show` in a fast `forever` loop.

A demo `.hex` that matches the app's default layout is attached to each [release](https://github.com/ikaros-ch/microbit-rc/releases/latest). It is built from [test.ts](test.ts).

### Notes
* Pairing is not required. The extension sets "No Pairing Required" for you.
* The extension uses the Bluetooth UART receive handler, so don't add your own `on bluetooth data received` block.
* IDs and channel names can only use letters, digits and `_`, with at most 8 characters, so every message fits in one Bluetooth packet.

## Protocol

Messages are plain-text lines over the Nordic UART service, so you can use them from any firmware.

| Direction | Line | Meaning |
|---|---|---|
| app → micro:bit | `B<id>=0\|1` | button |
| app → micro:bit | `T<id>=0\|1` | toggle |
| app → micro:bit | `S<id>=0..100` | slider |
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

## License

MIT

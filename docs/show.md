# Show

Show a number on every display widget in the app set to this channel. Values are sent at most every 100 ms, so you can call it in a fast loop.

```sig
rcPad.show("speed", 0)
```

## Parameters

* **channel**: the display channel set in the app, like `"speed"`
* **value**: the number to show

## Example

Send the micro:bit temperature to the "temp" display.

```blocks
basic.forever(function () {
    rcPad.show("temp", input.temperature())
})
```

```package
microbit-rc=github:ikaros-ch/microbit-rc
```

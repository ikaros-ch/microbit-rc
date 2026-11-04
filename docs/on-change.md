# On change

Run code when any widget (button, toggle, slider, joystick) with this ID changes value.

```sig
rcPad.onChange("S", function () {
})
```

## Parameters

* **id**: the widget ID set in the app, like `"S"`
* **handler**: the code to run

## Example

Show the slider position as a bar graph each time it moves.

```blocks
rcPad.onChange("S", function () {
    led.plotBarGraph(rcPad.value("S"), 100)
})
```

```package
microbit-rc=github:ikaros-ch/microbit-rc
```

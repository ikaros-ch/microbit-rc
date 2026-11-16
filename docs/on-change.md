# On change

Run code when any widget (button, toggle, slider, joystick) with this ID changes value.

```sig
rcPad.onChange("S", function () {
})
```

If the value changes again while your code is still running (for example during a `pause` or a tone), the code runs once more with the newest value, not once for every change.

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

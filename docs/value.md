# Value

Get the value of a widget: a slider gives 0 to 100, a single-axis stick -100 to 100 (up and right are positive), and buttons and toggles give 0 or 1.

```sig
rcPad.value("S")
```

## Parameters

* **id**: the widget ID set in the app, like `"S"`

## Example

Set the brightness of the screen with slider S.

```blocks
basic.showIcon(IconNames.Square)
basic.forever(function () {
    led.setBrightness(rcPad.value("S") * 255 / 100)
})
```

```package
microbit-rc=github:ikaros-ch/microbit-rc
```

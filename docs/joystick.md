# Joystick

Get the position of a joystick on one axis, from -100 to 100. Right and up are positive, and the stick springs back to 0.

```sig
rcPad.joystick("L", rcPad.Axis.X)
```

## Parameters

* **id**: the widget ID set in the app, like `"L"`
* **axis**: `x` for left/right, `y` for down/up

## Example

Light the LED that matches the joystick position.

```blocks
basic.forever(function () {
    basic.clearScreen()
    // -100..100 maps to columns and rows 0..4
    led.plot(Math.round(rcPad.joystick("L", rcPad.Axis.X) / 50) + 2, 2 - Math.round(rcPad.joystick("L", rcPad.Axis.Y) / 50))
})
```

```package
microbit-rc=github:ikaros-ch/microbit-rc
```

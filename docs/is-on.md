# Is on

Check if a button is held or a toggle switch is on.

```sig
rcPad.isOn("T1")
```

## Parameters

* **id**: the widget ID set in the app, like `"T1"`

## Example

Turn on pin P1 (an LED, for example) while toggle T1 is on.

```blocks
basic.forever(function () {
    if (rcPad.isOn("T1")) {
        pins.digitalWritePin(DigitalPin.P1, 1)
    } else {
        pins.digitalWritePin(DigitalPin.P1, 0)
    }
})
```

```package
microbit-rc=github:ikaros-ch/microbit-rc
```

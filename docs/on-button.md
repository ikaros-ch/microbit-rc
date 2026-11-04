# On button

Run code when a button widget in the RC Pad app is pressed or released.

```sig
rcPad.onButton("A", rcPad.ButtonEvent.Pressed, function () {
})
```

## Parameters

* **id**: the widget ID set in the app, like `"A"`
* **event**: `pressed` when the button goes down, `released` when it comes back up
* **handler**: the code to run

## Example

Show a heart while button A is held.

```blocks
rcPad.onButton("A", rcPad.ButtonEvent.Pressed, function () {
    basic.showIcon(IconNames.Heart)
})
rcPad.onButton("A", rcPad.ButtonEvent.Released, function () {
    basic.clearScreen()
})
```

```package
microbit-rc=github:ikaros-ch/microbit-rc
```

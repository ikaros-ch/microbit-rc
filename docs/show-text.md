# Show text

Show text on every display widget in the app set to this channel. Use English letters, digits and symbols only: the micro:bit can't store other letters, like Greek, in text.

```sig
rcPad.showText("msg", "hello")
```

## Parameters

* **channel**: the display channel set in the app, like `"msg"`
* **text**: the text to show

## Example

Show which button was pressed last.

```blocks
input.onButtonPressed(Button.A, function () {
    rcPad.showText("msg", "button A")
})
input.onButtonPressed(Button.B, function () {
    rcPad.showText("msg", "button B")
})
```

```package
microbit-rc=github:ikaros-ch/microbit-rc
```

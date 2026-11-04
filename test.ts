// Demo that matches the app's default layout (also the release .hex).
// How to test: flash this, open https://ikaros-ch.github.io/microbit-rc/ in Chrome/Edge,
// press Connect and pick the micro:bit, then try each widget and check each EXPECT line.
// PASS = all match. In the simulator there is no Bluetooth: PASS = runs with no errors.
rcPad.onButton("B", rcPad.ButtonEvent.Pressed, function () {
    rcPad.show("lamp", 1)
    // EXPECT: holding B lights the "lamp" display in the app
})
rcPad.onButton("B", rcPad.ButtonEvent.Released, function () {
    rcPad.show("lamp", 0)
    // EXPECT: releasing B turns the lamp off
})
basic.forever(function () {
    rcPad.show("speed", rcPad.value("S"))
    // EXPECT: moving slider S (0-100) updates the "speed" display within ~0.1 s
    rcPad.show("temp", input.temperature())
    // EXPECT: "temp" display shows the micro:bit temperature in °C
    // EXPECT: toggle T1 switches the "msg" text between "lights ON" and "lights off"
    rcPad.showText("msg", rcPad.isOn("T1") ? "lights ON" : "lights off")
    if (rcPad.isOn("A")) {
        basic.showIcon(IconNames.Heart, 0)
        // EXPECT: heart while button A is held
    } else {
        basic.clearScreen()
        led.plot(Math.round(rcPad.joystick("L", rcPad.Axis.X) / 50) + 2, 2 - Math.round(rcPad.joystick("L", rcPad.Axis.Y) / 50))
        // EXPECT: one LED follows joystick L (center LED when released)
    }
    basic.pause(50)
})
rcPad.onChange("S", function () {
    music.playTone(Note.C5, music.beat(BeatFraction.Sixteenth))
    // EXPECT: a short beep each time slider S moves (V2 speaker or headphones on P0)
})

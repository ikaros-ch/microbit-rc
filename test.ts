// Demo that matches the app's default layout (also the release .hex).
// How to test: flash this, open https://ikaros-ch.github.io/microbit-rc/ in Chrome/Edge,
// press Connect and pick the micro:bit, then try each widget and check each EXPECT line.
// PASS = all match. In the simulator there is no Bluetooth: PASS = runs with no errors.
gamepad.onButton("B", GamepadButtonEvent.Pressed, function () {
    gamepad.show("lamp", 1)
    // EXPECT: holding B lights the "lamp" display in the app
})
gamepad.onButton("B", GamepadButtonEvent.Released, function () {
    gamepad.show("lamp", 0)
    // EXPECT: releasing B turns the lamp off
})
basic.forever(function () {
    gamepad.show("speed", gamepad.value("S"))
    // EXPECT: moving slider S (0-100) updates the "speed" display within ~0.1 s
    gamepad.show("temp", input.temperature())
    // EXPECT: "temp" display shows the micro:bit temperature in °C
    // EXPECT: toggle T1 switches the "msg" text between ON and off, Greek letters intact
    gamepad.showText("msg", gamepad.isOn("T1") ? "φώτα ανοιχτά, lights ON" : "φώτα κλειστά, lights off")
    if (gamepad.isOn("A")) {
        basic.showIcon(IconNames.Heart, 0)
        // EXPECT: heart while button A is held
    } else {
        basic.clearScreen()
        led.plot(Math.round(gamepad.joystick("L", GamepadAxis.X) / 50) + 2, 2 - Math.round(gamepad.joystick("L", GamepadAxis.Y) / 50))
        // EXPECT: one LED follows joystick L (center LED when released)
    }
    basic.pause(50)
})

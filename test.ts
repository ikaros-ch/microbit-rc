// Demo that matches the app's default layout.
gamepad.onButton("B", GamepadButtonEvent.Pressed, function () {
    gamepad.show("lamp", 1)
})
gamepad.onButton("B", GamepadButtonEvent.Released, function () {
    gamepad.show("lamp", 0)
})
basic.forever(function () {
    gamepad.show("speed", gamepad.value("S"))
    gamepad.show("temp", input.temperature())
    gamepad.showText("msg", gamepad.isOn("T1") ? "φώτα ανοιχτά, lights ON" : "φώτα κλειστά, lights off")
    if (gamepad.isOn("A")) {
        basic.showIcon(IconNames.Heart, 0)
    } else {
        basic.clearScreen()
        led.plot(Math.round(gamepad.joystick("L", GamepadAxis.X) / 50) + 2, 2 - Math.round(gamepad.joystick("L", GamepadAxis.Y) / 50))
    }
    basic.pause(50)
})

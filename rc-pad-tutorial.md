# Drive your micro:bit with your phone

### @diffs true

## Introduction @showdialog

Turn a phone, tablet or computer into a remote control for your micro:bit!

You will use the free **RC Pad** app (https://ikaros-ch.github.io/microbit-rc/) and the ``||rcPad:RC Pad||`` blocks. The app talks to the micro:bit over Bluetooth, so you don't need a second micro:bit.

## A heart button

Open the ``||rcPad:RC Pad||`` category and drag an ``||rcPad:on rc pad button "A" pressed||`` block into the workspace.

From ``||basic:Basic||``, put a ``||basic:show icon||`` block inside it and pick the heart.

```blocks
rcPad.onButton("A", rcPad.ButtonEvent.Pressed, function () {
    basic.showIcon(IconNames.Heart)
})
```

## Clear the screen

Drag in another ``||rcPad:on rc pad button "A"||`` block and change **pressed** to **released**.

Put ``||basic:clear screen||`` inside it, so the heart only shows while you hold the button.

```blocks
rcPad.onButton("A", rcPad.ButtonEvent.Pressed, function () {
    basic.showIcon(IconNames.Heart)
})
rcPad.onButton("A", rcPad.ButtonEvent.Released, function () {
    basic.clearScreen()
})
```

## A light switch

The app has a **Lights** switch with the ID **T1**.

Into the ``||basic:forever||`` block, add an ``||logic:if then else||`` block. Use ``||rcPad:rc pad "T1" is on||`` as its condition.

Then use ``||rcPad:rc pad display "msg" show text||`` to send **lights ON** or **lights off** to the app's **Status** display.

```blocks
rcPad.onButton("A", rcPad.ButtonEvent.Pressed, function () {
    basic.showIcon(IconNames.Heart)
})
rcPad.onButton("A", rcPad.ButtonEvent.Released, function () {
    basic.clearScreen()
})
basic.forever(function () {
    if (rcPad.isOn("T1")) {
        rcPad.showText("msg", "lights ON")
    } else {
        rcPad.showText("msg", "lights off")
    }
})
```

## Send a value back

The **Throttle** slider has the ID **S** and gives 0 to 100.

At the end of ``||basic:forever||``, add ``||rcPad:rc pad display "speed" show||`` and put ``||rcPad:rc pad "S" value||`` in it. The app's **Speed** bar will follow the slider.

```blocks
rcPad.onButton("A", rcPad.ButtonEvent.Pressed, function () {
    basic.showIcon(IconNames.Heart)
})
rcPad.onButton("A", rcPad.ButtonEvent.Released, function () {
    basic.clearScreen()
})
basic.forever(function () {
    if (rcPad.isOn("T1")) {
        rcPad.showText("msg", "lights ON")
    } else {
        rcPad.showText("msg", "lights off")
    }
    rcPad.show("speed", rcPad.value("S"))
})
```

## Bluetooth setting @showdialog

Before you download, click the **gear** (top right) → **Project Settings**, select **No Pairing Required**, and click **Save**.

Without this setting the app connects, but the micro:bit ignores the buttons.

## Download and connect

1. Click **Download** and copy the program to your micro:bit.
2. On a phone, tablet or computer, open https://ikaros-ch.github.io/microbit-rc/ in **Chrome** or **Edge**.
3. Press **Connect** and choose your micro:bit.
4. Hold **A**, flip **Lights** and move **Throttle**!

Only one device can connect to a micro:bit at a time.

## Well done! @showdialog

Your micro:bit is now remote controlled!

Next ideas:
* Use ``||rcPad:rc pad joystick "L" x||`` to move an LED, a servo or a robot.
* Press **Edit** in the app to add your own buttons, sliders and displays, and give them your own IDs.

# Οδήγησε το micro:bit με το κινητό σου

### @diffs true

## Εισαγωγή @showdialog

Κάνε το κινητό, το tablet ή τον υπολογιστή σου τηλεχειριστήριο για το micro:bit!

Θα χρησιμοποιήσεις τη δωρεάν εφαρμογή **RC Pad** (https://ikaros-ch.github.io/microbit-rc/) και τα μπλοκ ``||rcPad:RC Pad||``. Η εφαρμογή μιλάει με το micro:bit μέσω Bluetooth, οπότε δεν χρειάζεσαι δεύτερο micro:bit.

Αν το MakeCode πει ότι το **radio** και το **bluetooth** δεν μπορούν να χρησιμοποιηθούν μαζί, πάτησε **Remove radio**.

## Κουμπί καρδιά

Άνοιξε την κατηγορία ``||rcPad:RC Pad||`` και σύρε ένα μπλοκ ``||rcPad:όταν το κουμπί rc pad "A" πατηθεί||`` στον χώρο εργασίας.

Από τα ``||basic:Βασικά||``, βάλε μέσα του ένα ``||basic:δείξε εικονίδιο||`` και διάλεξε την καρδιά.

```blocks
rcPad.onButton("A", rcPad.ButtonEvent.Pressed, function () {
    basic.showIcon(IconNames.Heart)
})
```

## Καθάρισε την οθόνη

Σύρε άλλο ένα μπλοκ ``||rcPad:όταν το κουμπί rc pad "A"||`` και άλλαξε το **πατηθεί** σε **αφεθεί**.

Βάλε μέσα του ``||basic:καθαρισμός οθόνης||``, ώστε η καρδιά να φαίνεται μόνο όσο κρατάς το κουμπί.

```blocks
rcPad.onButton("A", rcPad.ButtonEvent.Pressed, function () {
    basic.showIcon(IconNames.Heart)
})
rcPad.onButton("A", rcPad.ButtonEvent.Released, function () {
    basic.clearScreen()
})
```

## Διακόπτης για φώτα

Η εφαρμογή έχει διακόπτη **Φώτα** με ID **T1**.

Μέσα στο ``||basic:για πάντα||`` πρόσθεσε ένα μπλοκ ``||logic:εάν τότε αλλιώς||`` με συνθήκη ``||rcPad:rc pad "T1" είναι ενεργό||``.

Με το ``||rcPad:οθόνη rc pad "msg" δείξε κείμενο||`` στείλε **lights ON** ή **lights off** στην οθόνη **Κατάσταση** της εφαρμογής. Το micro:bit δέχεται μόνο λατινικούς χαρακτήρες σε κείμενο.

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

## Στείλε μια τιμή πίσω

Ο ρυθμιστής **Γκάζι** έχει ID **S** και δίνει 0 έως 100.

Στο τέλος του ``||basic:για πάντα||`` πρόσθεσε ``||rcPad:οθόνη rc pad "speed" δείξε||`` και βάλε μέσα ``||rcPad:τιμή rc pad "S"||``. Η μπάρα **Ταχύτητα** της εφαρμογής θα ακολουθεί τον ρυθμιστή.

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

## Ρύθμιση Bluetooth @showdialog

Πριν το κατεβάσεις, πάτησε το **γρανάζι** (πάνω δεξιά) → **Project Settings**, διάλεξε **No Pairing Required** και πάτησε **Save**.

Χωρίς αυτή τη ρύθμιση η εφαρμογή συνδέεται, αλλά το micro:bit αγνοεί τα κουμπιά.

## Κατέβασε και σύνδεσε

1. Πάτησε **Download** και αντέγραψε το πρόγραμμα στο micro:bit.
2. Σε κινητό, tablet ή υπολογιστή, άνοιξε το https://ikaros-ch.github.io/microbit-rc/ σε **Chrome** ή **Edge**.
3. Πάτησε **Connect** και διάλεξε το micro:bit σου.
4. Κράτα το **A**, γύρνα τα **Φώτα** και κούνησε το **Γκάζι**!

Μόνο μία συσκευή μπορεί να συνδεθεί σε ένα micro:bit κάθε φορά.

## Μπράβο! @showdialog

Το micro:bit σου έχει πλέον τηλεχειριστήριο!

Επόμενες ιδέες:
* Με το ``||rcPad:rc pad joystick "L" x||`` κούνησε ένα LED, ένα σέρβο ή ένα ρομπότ.
* Πάτησε **Edit** στην εφαρμογή για να προσθέσεις δικά σου κουμπιά, ρυθμιστές και οθόνες με δικά σου ID.

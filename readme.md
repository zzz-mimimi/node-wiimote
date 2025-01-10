# node-wiimote

A super simple package for interacting with Wiimotes easily.

## Accessible data
* All buttons except the power button
* Accelerometer data

### Example code
```js
import { Wiimote } from 'node-wiimote';

const wiimote = new Wiimote();

// Turn all four leds on
wiimote.setLeds(true, true, true, true);

wiimote.on('data', (data) => {
/*
    Handle data
    
    data = {
        A: false,
        B: false,
        Plus: false,
        Minus: false,
        Home: false,
        Up: false,
        Down: false,
        Left: false,
        Right: false,
        One: false,
        Two: false,
        accelX: 0.0,
        accelY: 0.0,
        accelZ: 0.0
    }
*/
});

wiimote.on('error', (error) => {
    // Handle error
});
```
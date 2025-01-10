import { EventEmitter } from 'events'
import HID from 'node-hid'

export class Wiimote extends EventEmitter {
    constructor() {
        super()
        this.wiimote = null
        
        while (!this.wiimote) {
            let res = HID.devices().find(x => x.product.includes('Nintendo RVL-CNT-01'))
            if (res) this.wiimote = new HID.HID(res.path)
        }

        this.emit('connected')

        // Enable continuous data sending in mode 0x31 (Core Buttons and Accelerometer)
        this.wiimote.write(Buffer.from([0x12, 0x04, 0x31]))

        this.wiimote.on('data', this.onData.bind(this))
        this.wiimote.on('error', this.onError.bind(this))
    }

    onData(buffer) {
        if (buffer.length < 22) return console.error('Unexpected buffer length:', buffer.length)

        this.emit('data', {
            A:      (buffer[2] & 0x08) != 0, // Byte 2, bit 3
            B:      (buffer[2] & 0x04) != 0, // Byte 2, bit 2
            Plus:   (buffer[1] & 0x10) != 0, // Byte 1, bit 4
            Minus:  (buffer[2] & 0x10) != 0, // Byte 2, bit 4
            Home:   (buffer[2] & 0x80) != 0, // Byte 2, bit 7
            Up:     (buffer[1] & 0x08) != 0, // Byte 1, bit 3
            Down:   (buffer[1] & 0x04) != 0, // Byte 1, bit 2
            Left:   (buffer[1] & 0x01) != 0, // Byte 1, bit 0
            Right:  (buffer[1] & 0x02) != 0, // Byte 1, bit 1
            One:    (buffer[2] & 0x02) != 0, // Byte 2, bit 1
            Two:    (buffer[2] & 0x01) != 0, // Byte 2, bit 0
            accelX: (buffer[3] - 128) / 128, // Byte 3
            accelY: (buffer[4] - 128) / 128, // Byte 4
            accelZ: (buffer[5] - 128) / 128, // Byte 5
        })
    }

    onError(error) {
        this.emit('error', error)
    }

    setLeds(one = false, two = false, three = false, four = false) {
        this.wiimote.write(Buffer.from([0x11, (one * 0x10 + two * 0x20 + three * 0x40 + four * 0x80)]))
    }
}
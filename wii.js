import HID from 'node-hid'
import { EventEmitter } from 'events'

export class Wiimote extends EventEmitter {
    constructor() {
        super()
        this.wiimote = null
        this.motionPlusEnabled = false
        this.allowSending = false
        
        while (!this.wiimote) {
            let res = HID.devices().find(x => x.product.includes('Nintendo RVL-CNT-01'))
            if (res) this.wiimote = new HID.HID(res.path)
        }

        this.emit('connected')

        this.wiimote.on('data', this.onData.bind(this))
        this.wiimote.on('error', this.onError.bind(this))
    }

    onData(buffer) {
        if (!this.allowSending) {
            this.allowSending = true
            this.wiimote.write(Buffer.from([0x12, 0x00, 0x35])) // Continuous send mode
        }

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
            ...(this.motionPlusEnabled && {
                motionplus: {
                    yaw: {
                        downSpeed: buffer[0], // Byte 0
                        high: ((buffer[3] & 0xFC) << 8) | buffer[0], // Combining Yaw Down Speed 13-8 bits from byte 3
                        slowMode: (buffer[3] & 0x02) != 0, // Yaw slow mode from bit 1 of byte 3
                    },
                    roll: {
                        leftSpeed: buffer[1], // Byte 1
                        high: ((buffer[4] & 0xFC) << 8) | buffer[1], // Combining Roll Left Speed 13-8 bits from byte 4
                        slowMode: (buffer[4] & 0x02) != 0, // Roll slow mode from bit 1 of byte 4
                    },
                    pitch: {
                        leftSpeed: buffer[2], // Byte 2
                        high: ((buffer[5] & 0xFC) << 8) | buffer[2], // Combining Pitch Left Speed 13-8 bits from byte 5
                        slowMode: (buffer[3] & 0x01) != 0, // Pitch slow mode from bit 0 of byte 3
                    }
                }
            })
        })
    }

    onError(err) {
        this.emit('error', err)
    }

    setLeds(one = false, two = false, three = false, four = false) {
        this.wiimote.write(Buffer.from([0x11, (one * 0x10 + two * 0x20 + three * 0x40 + four * 0x80)]))
    }

    enableMotionPlus() {
        this.wiimote.write(Buffer.from([0x12, 0x04]))
        this.motionPlusEnabled = true
    }

    disableMotionPlus() {
        this.wiimote.write(Buffer.from([0x12, 0x00]))
        this.motionPlusEnabled = false
    }
}
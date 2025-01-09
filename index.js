import { Wiimote } from './wii.js'

const wm = new Wiimote()

wm.setLeds(true, true, true, true)

wm.on('data', (data) => {
    console.clear()
    console.log(data)
})

wm.on('error', (err) => {
    console.error('Error:', err)
})
import { Vec2 } from "./Vec2"

export function getLine(start: Vec2, end: Vec2): Vec2[] {
    let result: Vec2[] = []

    let x0 = start.x
    let y0 = start.y
    let x1 = end.x
    let y1 = end.y

    let dx = Math.abs(x1 - x0) // distance to travel in X
    let dy = Math.abs(y1 - y0) // distance to travel in Y

    let ix = x0 < x1 ? 1 : -1 // x will increase or decrease at each step
    let iy = y0 < y1 ? 1 : -1 // y will increase or decrease at each step

    let e = 0 // Current error

    for (let i = 0; i < dx + dy; i++) {
        result.push(new Vec2(x0, y0))
        let e1 = e + dy
        let e2 = e - dx
        if (Math.abs(e1) < Math.abs(e2)) {
            // Error will be smaller moving on X
            x0 += ix
            e = e1
        } else {
            // Error will be smaller moving on Y
            y0 += iy
            e = e2
        }
    }

    result.push(end)
    return result
}
export class Vec2 {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    add(other: Vec2) {
        return new Vec2(this.x + other.x, this.y + other.y)
    }

    sub(other: Vec2) {
        return new Vec2(this.x - other.x, this.y - other.y)
    }

    mul(other: Vec2) {
        return new Vec2(this.x * other.x, this.y * other.y)
    }

    div(other: Vec2) {
        return new Vec2(this.x / other.x, this.y / other.y)
    }

    scale(factor: number) {
        return new Vec2(this.x * factor, this.y * factor)
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y)
    }

    normalize() {
        let length = this.length()
        return new Vec2(this.x / length, this.y / length)
    }

    round() {
        return new Vec2(Math.round(this.x), Math.round(this.y))
    }

    floor() {
        return new Vec2(Math.floor(this.x), Math.floor(this.y))
    }

    clone() {
        return new Vec2(this.x, this.y)
    }

    equals(other: Vec2) {
        return this.x == other.x && this.y == other.y
    }

    rotate(angle: number) {
        let x = this.x * Math.cos(angle) - this.y * Math.sin(angle)
        let y = this.x * Math.sin(angle) + this.y * Math.cos(angle)
        return new Vec2(x, y)
    }

    angle() {
        return Math.atan2(this.y, this.x)
    }

    lerp(other: Vec2, t: number) {
        return new Vec2(this.x + (other.x - this.x) * t, this.y + (other.y - this.y) * t)
    }

    static zero() { return new Vec2(0, 0) }
    static one() { return new Vec2(1, 1) }
    static up() { return new Vec2(0, -1) }
    static down() { return new Vec2(0, 1) }
    static left() { return new Vec2(-1, 0) }
    static right() { return new Vec2(1, 0) }

}
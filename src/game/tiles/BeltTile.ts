import { Game } from "../Game"
import { TileType } from "../Grid"
import { Camera } from "../Renderer"
import type { ItemType } from "../Types"
import { Vec2 } from "../Vec2"
import { BaseTile, type BeltableTile } from "./BaseTile"


export interface BeltTileItem {
    type: ItemType
    progress: number
}

export class BeltTile extends BaseTile {
    tileData: {
        items: BeltTileItem[],
        corner: number
    } = {
            items: [],
            corner: 0
        }

    constructor(pos: Vec2, rotation: number) {
        super(pos, rotation)
        this.updateCornerValue()
    }


    get type(): TileType {
        return TileType.Belt
    }

    draw(ctx: CanvasRenderingContext2D) {

        let tile = this
        let cam = Game.camera
        let screenPos = Camera.worldToScreen(new Vec2(tile.pos.x, tile.pos.y))
        let lw = 0.01

        ctx.save()
        ctx.translate(screenPos.x + 0.5 * cam.zoom + 0.5, screenPos.y + 0.5 * cam.zoom + 0.5)
        ctx.scale(cam.zoom, cam.zoom)
        ctx.rotate((tile.rotation) * Math.PI / 2)

        ctx.lineWidth = lw * 2
        ctx.strokeStyle = 'rgb(255, 255, 255)'
        ctx.beginPath()

        // draw belt
        if (tile.tileData.corner == 0) {

            // outline
            ctx.moveTo(-0.5 + lw, -0.5)
            ctx.lineTo(-0.5 + lw, 0.5)
            ctx.moveTo(0.5 - lw, -0.5)
            ctx.lineTo(0.5 - lw, 0.5)

            // arrows
            drawArrow(ctx, new Vec2(0, 1 / 3), 0)
            drawArrow(ctx, new Vec2(0, 0), 0)
            drawArrow(ctx, new Vec2(0, -1 / 3), 0)

        } else if (tile.tileData.corner == -1) {

            // arc to the left
            ctx.arc(-0.5 - lw, 0.5 + lw, 1, Math.PI * 1.5, Math.PI * 2)
            ctx.moveTo(-0.5 + lw, 0.5)
            ctx.bezierCurveTo(-0.5 + lw, 0.5 - lw, -0.5 + lw, 0.5 - lw, -0.5, 0.5 - lw)

            // arrows
            drawArrow(ctx, new Vec2(0, 1 / 3), 0)
            drawArrow(ctx, new Vec2(-1 / 7, 1 / 7), -Math.PI / 4)
            drawArrow(ctx, new Vec2(-1 / 3, 0), -Math.PI / 2)

        } else if (tile.tileData.corner == 1) {

            // arc to the right
            ctx.arc(0.5 + lw, 0.5 + lw, 1, Math.PI * 1, Math.PI * 1.5)
            ctx.moveTo(0.5 - lw, 0.5)
            ctx.bezierCurveTo(0.5 - lw, 0.5 - lw, 0.5 - lw, 0.5 - lw, 0.5, 0.5 - lw)

            // arrows
            drawArrow(ctx, new Vec2(0, 1 / 3), 0)
            drawArrow(ctx, new Vec2(1 / 7, 1 / 7), Math.PI / 4)
            drawArrow(ctx, new Vec2(1 / 3, 0), Math.PI / 2)

        }



        ctx.stroke()

        // draw items
        for (let item of tile.tileData.items) {
            const startBelt = new Vec2(0, 0.5)
            const c = tile.tileData.corner
            const endBelt = c === 0 ? new Vec2(0, -0.5) :
                c === -1 ? new Vec2(-0.5, 0) :
                    c === 1 ? new Vec2(0.5, 0) :
                        new Vec2(0, 0)

            const itemPos = c !== 0 ? (() => {
                const radius = 0.5
                const center = c === -1 ? new Vec2(-0.5, 0.5) : new Vec2(0.5, 0.5)
                const itemAngle = (c === -1 ? 0 : Math.PI) + (c === -1 ? -1 : 1) * Math.PI / 2 * (item.progress / 100)
                const pos = new Vec2(center.x + radius * Math.cos(itemAngle), center.y + radius * Math.sin(itemAngle))
                pos.rotate((tile.rotation) * Math.PI / 2)
                return pos
            })() : startBelt.lerp(endBelt, item.progress / 100)

            this.drawBeltItem(item, itemPos, ctx)
        }

        ctx.restore()

        // draw debug info


    }

    inputPos() {
        let rotation = this.rotation
        let inputPos = this.pos.add(new Vec2(0, 1).rotate(rotation * Math.PI / 2))
        return inputPos
    }

    outputPos() {
        let rotation = this.rotation + this.tileData.corner
        let outputPos = this.pos.add(new Vec2(0, -1).rotate(rotation * Math.PI / 2))
        return outputPos
    }

    isInputBlocked() {
        let closestItem = this.tileData.items.at(-1)
        if (closestItem && closestItem.progress < 25) return true
        return false
    }

    updateCornerValue() {
        let neighbors = this.getBeltableNeighbors()
        let inputNeighbor: BeltableTile | undefined // the neighbor that has an output facing this tile
        let outputNeighbor: BeltableTile | undefined // the neighbor that has an input facing this tile

        if (neighbors.length > 0) {
            let inputNeighbors = []
            let outputNeighbors = []
            for (let n of neighbors) {
                if (n.outputPos().equals(this.pos)) inputNeighbors.push(n)
                if (n.inputPos().equals(this.pos)) outputNeighbors.push(n)
            }

            if (inputNeighbors.length == 1) {
                inputNeighbor = inputNeighbors[0]
            } else if (inputNeighbors.length > 1) {
                let inputMatches = inputNeighbors.find(n => n.pos.equals(this.inputPos()))
                if (inputMatches) inputNeighbor = inputMatches
            }

            if (outputNeighbors.length == 1) {
                outputNeighbor = outputNeighbors[0]
            } else if (outputNeighbors.length > 1) {
                let outputMatches = outputNeighbors.find(n => n.pos.equals(this.outputPos()))
                if (outputMatches) outputNeighbor = outputMatches
            }

            if (inputNeighbor) {
                let angle = inputNeighbor.outputPos().sub(this.inputPos()).angle() / (Math.PI / 2)
                let corner = ((((angle - inputNeighbor.rotation - inputNeighbor.tileData.corner) + 5) % 4) - 2) * -1
                //console.log('inputNeighbor', inputNeighbor.outputPos(), this.inputPos(), angle, corner)
                if (corner == -1 || corner == 1) {
                    this.rotation -= corner
                    this.tileData.corner = corner
                }
            }
            if (outputNeighbor) {
                let angle = outputNeighbor.inputPos().sub(this.outputPos()).angle() / (Math.PI / 2)
                let corner = ((((angle - outputNeighbor.rotation - outputNeighbor.tileData.corner) + 5) % 4) - 2) * -1
                //console.log('outputNeighbor', outputNeighbor.inputPos(), this.outputPos(), angle, corner)
                if (corner == -1 || corner == 1) {
                    this.tileData.corner = corner
                }
            }
        }
    }
}

export function drawArrow(ctx: CanvasRenderingContext2D, pos: Vec2, rotation: number) {

    let arrowPos1 = pos.add(new Vec2(-0.1, 0.05).rotate(rotation))
    let arrowPos2 = pos.add(new Vec2(0, -0.05).rotate(rotation))
    let arrowPos3 = pos.add(new Vec2(0.1, 0.05).rotate(rotation))

    ctx.moveTo(arrowPos1.x, arrowPos1.y)
    ctx.lineTo(arrowPos2.x, arrowPos2.y)
    ctx.lineTo(arrowPos3.x, arrowPos3.y)

}
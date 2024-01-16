import { Game } from "../Game"
import { TileType, type Tile } from "../Grid"
import { Camera } from "../Renderer"
import { ItemType } from "../Types"
import { Vec2 } from "../Vec2"
import { isBeltTile, isBeltableTile } from "./BaseTile"
import { BeltTile, drawArrow, type BeltTileItem } from "./BeltTile"

type direction = 'forward' | 'right' | 'left'

export interface SplitterTileItem extends BeltTileItem {
    direction?: direction
}

export class SplitterTile extends BeltTile {
    tileData: {
        outputs: {
            forward: boolean
            right: boolean
            left: boolean
        },
        items: SplitterTileItem[],
        corner: number,
        lastSplit?: direction
    } = {
            outputs: {
                forward: false,
                right: false,
                left: false
            },
            items: [],
            corner: 0,
        }
    constructor(pos: Vec2, rotation: number) {
        super(pos, rotation)
        this.updateOutputs()
    }


    get type(): TileType {
        return TileType.Splitter
    }

    draw(ctx: CanvasRenderingContext2D): void {
        let tile = this
        let cam = Game.camera
        let screenPos = Camera.worldToScreen(new Vec2(tile.pos.x, tile.pos.y))

        let corners = [new Vec2(-0.5, -0.5), new Vec2(0.5, -0.5), new Vec2(0.5, 0.5), new Vec2(-0.5, 0.5)]
        ctx.save()
        ctx.translate(screenPos.x + 0.5 * cam.zoom, screenPos.y + 0.5 * cam.zoom)
        ctx.scale(cam.zoom, cam.zoom)
        ctx.rotate((tile.rotation) * Math.PI / 2)

        ctx.strokeStyle = 'rgb(255, 255, 255)'
        ctx.fillStyle = 'rgb(255, 255, 255)'
        ctx.lineWidth = 0.02

        ctx.beginPath()
        drawArrow(ctx, new Vec2(0, 1 / 3), 0)
        ctx.stroke()

        let drawSide = (side: direction) => {

            const sidesPos = {
                forward: [corners[0], corners[1]],
                right: [corners[1], corners[2]],
                left: [corners[0], corners[3]]
            }[side]

            ctx.beginPath()
            if (!this.tileData.outputs[side]) {
                ctx.strokeStyle = 'rgb(255, 255, 255)'
                ctx.moveTo(sidesPos[0].x, sidesPos[0].y)
                ctx.lineTo(sidesPos[1].x, sidesPos[1].y)
                ctx.stroke()
            }
            ctx.beginPath()
            ctx.strokeStyle = this.tileData.outputs[side] ? 'rgb(255, 255, 255)' : 'rgb(15, 15, 15)'
            if (this.nextSplit() === side) ctx.strokeStyle = 'rgb(150, 255, 150)'
            drawArrow(ctx,
                { forward: new Vec2(0, -1 / 3), right: new Vec2(1 / 3, 0), left: new Vec2(-1 / 3, 0) }[side],
                { forward: 0, right: Math.PI / 2, left: -Math.PI / 2 }[side])
            ctx.stroke()
        }

        drawSide('forward')
        drawSide('right')
        drawSide('left')

        // draw items
        ctx.beginPath()
        ctx.strokeStyle = 'rgb(255, 255, 255)'

        for (let item of tile.tileData.items) {
            const dir = item.direction
            const progress = ((item.progress % 50) * 2) / 100
            const startBelt = dir ? new Vec2(0, 0) : new Vec2(0, 0.5)
            const endBelt = dir === 'forward' ? new Vec2(0, -0.5) :
                dir === 'left' ? new Vec2(-0.5, 0) :
                    dir === 'right' ? new Vec2(0.5, 0) :
                        new Vec2(0, 0)

            const itemPos = startBelt.lerp(endBelt, progress)

            this.drawBeltItem(item, itemPos, ctx)
        }

        ctx.restore()
    }

    getOutputDirections(): direction[] {
        const { outputs } = this.tileData
        const directions: direction[] = []
        if (outputs.forward) directions.push('forward')
        if (outputs.right) directions.push('right')
        if (outputs.left) directions.push('left')
        return directions
    }

    nextSplit(attempt = 0): direction | null {
        const { lastSplit } = this.tileData
        const directions = this.getOutputDirections()
        const nextSplit = directions[(directions.indexOf(lastSplit || 'forward') + 1) % directions.length]
        if (this.tileData.items.find(item => item.direction === nextSplit && item.progress === 99)) {
            this.tileData.lastSplit = nextSplit
            if (attempt > directions.length) return null
            return this.nextSplit(attempt + 1)
        }
        return nextSplit
    }

    switchDirection(): direction | null {
        const nextSplit = this.nextSplit()
        if (nextSplit == null) return null
        this.tileData.lastSplit = nextSplit
        return nextSplit
    }

    directionToOutputPos(direction: direction): Vec2 {
        let relativeDirection = direction === 'forward' ? Vec2.up() :
            direction === 'right' ? Vec2.right() :
                direction === 'left' ? Vec2.left() :
                    Vec2.zero()

        return relativeDirection.rotate(this.rotation * Math.PI / 2).add(this.pos)
    }

    updateOutputs() {
        const { grid } = Game.world
        const { rotation, pos } = this
        const directions = [Vec2.up(), Vec2.right(), Vec2.left()]
        const outputs = directions.map((dir, i) => {
            const tile = grid.getTile(pos.add(dir.rotate(rotation * Math.PI / 2)))
            return tile && isBeltableTile(tile) && tile.inputPos().equals(pos)
        })

        this.tileData.outputs = {
            forward: outputs[0] || false,
            right: outputs[1] || false,
            left: outputs[2] || false,
        }
    }
}
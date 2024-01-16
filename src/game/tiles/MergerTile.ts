import { Game } from "../Game"
import { TileType, type Tile } from "../Grid"
import { tickCount } from "../Process"
import { Camera } from "../Renderer"
import { Vec2 } from "../Vec2"
import { isBeltTile, isBeltableTile, type BeltableTile } from "./BaseTile"
import { BeltTile, drawArrow, type BeltTileItem } from "./BeltTile"

type direction = 'forward' | 'right' | 'left'

export interface MergerTileItem extends BeltTileItem {
    direction?: direction
}

export class MergerTile extends BeltTile {
    tileData: {
        inputs: {
            forward: boolean
            right: boolean
            left: boolean
        },
        items: MergerTileItem[],
        corner: number,
        lastMergeDir?: direction
        lastMergeTick: number
    } = {
            inputs: {
                forward: false,
                right: false,
                left: false
            },
            items: [],
            corner: 0,
            lastMergeTick: 0
        }
    constructor(pos: Vec2, rotation: number) {
        super(pos, rotation)
        this.updateInputs()
    }


    get type(): TileType {
        return TileType.Merger
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
        drawArrow(ctx, new Vec2(0, -1 / 3), 0)
        ctx.stroke()

        let drawSide = (side: direction) => {

            const sidesPos = {
                forward: [corners[2], corners[3]],
                right: [corners[1], corners[2]],
                left: [corners[0], corners[3]]
            }[side]

            ctx.beginPath()
            if (!this.tileData.inputs[side]) {
                ctx.strokeStyle = 'rgb(255, 255, 255)'
                ctx.moveTo(sidesPos[0].x, sidesPos[0].y)
                ctx.lineTo(sidesPos[1].x, sidesPos[1].y)
                ctx.stroke()
            }
            ctx.beginPath()
            ctx.strokeStyle = this.tileData.inputs[side] ? 'rgb(255, 255, 255)' : 'rgb(15, 15, 15)'
            drawArrow(ctx,
                { forward: new Vec2(0, 1 / 3), right: new Vec2(1 / 3, 0), left: new Vec2(-1 / 3, 0) }[side],
                { forward: 0, right: -Math.PI / 2, left: Math.PI / 2 }[side])
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
            let startBelt = dir === 'forward' ? new Vec2(0, 0.5) :
                dir === 'left' ? new Vec2(-0.5, 0) :
                    dir === 'right' ? new Vec2(0.5, 0) :
                        new Vec2(0, 0)
            let endBelt = new Vec2(0, 0)

            if (item.progress >= 50) {
                startBelt = new Vec2(0, 0)
                endBelt = new Vec2(0, -0.5)
            }

            const itemPos = startBelt.lerp(endBelt, progress)

            this.drawBeltItem(item, itemPos, ctx)
        }

        ctx.restore()
    }

    getInputDirections(): direction[] {
        const { inputs } = this.tileData
        const directions: direction[] = []
        if (inputs.forward) directions.push('forward')
        if (inputs.right) directions.push('right')
        if (inputs.left) directions.push('left')
        return directions
    }

    nextMerge(dir: direction, attempt = 0): direction | null {
        const { lastMergeDir } = this.tileData
        const directions = this.getInputDirections()
        const waitingInputs = this.getWaitingInputs()
        const nextMerge = directions[(directions.indexOf(lastMergeDir || 'forward') + 1) % directions.length]
        const nextMergeTile = Game.world.grid.getTile(this.directionToInputPos(nextMerge)) as BeltableTile

        let firstItem = this.tileData.items.at(-1)
        if (firstItem && firstItem.progress < 25) return null

        if (!isBeltableTile(nextMergeTile)) return null
        if (tickCount - this.tileData.lastMergeTick < 25) return null
        if (waitingInputs.length === 0) return null

        if (!waitingInputs.includes(nextMerge)) {
            this.tileData.lastMergeDir = nextMerge
            if (attempt > directions.length) return null
            return this.nextMerge(dir, attempt + 1)
        }
        if (dir === nextMerge) return nextMerge
        return null
    }

    getWaitingInputs(): direction[] {
        const { grid } = Game.world
        const { rotation, pos } = this
        const directions = this.getInputDirections()
        const inputs = directions.map((dir, i) => {
            const tile = grid.getTile(this.directionToInputPos(dir)) as BeltableTile
            if (!tile) return null
            const item = tile.tileData.items.find(item => item.progress === 99)
            return item ? { tile, item, i } : null
        }).filter(input => input != null) as { tile: BeltableTile, item: MergerTileItem, i: number }[]
        return inputs.map(input => directions[input.i])
    }

    merge(dir: direction): direction | null {
        const lastMergeDir = this.nextMerge(dir)
        if (lastMergeDir == null) return null
        this.tileData.lastMergeDir = lastMergeDir
        this.tileData.lastMergeTick = tickCount
        return lastMergeDir
    }

    directionToInputPos(direction: direction): Vec2 {
        let relativeDirection = direction === 'forward' ? Vec2.down() :
            direction === 'right' ? Vec2.right() :
                direction === 'left' ? Vec2.left() :
                    Vec2.zero()

        return relativeDirection.rotate(this.rotation * Math.PI / 2).add(this.pos)
    }

    updateInputs() {
        const { grid } = Game.world
        const { rotation, pos } = this
        const directions = [Vec2.down(), Vec2.right(), Vec2.left()]
        const outputs = directions.map((dir, i) => {
            const tile = grid.getTile(pos.add(dir.rotate(rotation * Math.PI / 2)))
            return tile && isBeltableTile(tile) && tile.outputPos().equals(pos)
        })

        this.tileData.inputs = {
            forward: outputs[0] || false,
            right: outputs[1] || false,
            left: outputs[2] || false,
        }
    }
}
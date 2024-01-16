import { Game } from "../Game"
import { TileType, type Tile } from "../Grid"
import { ItemType } from "../Types"
import { Vec2 } from "../Vec2"
import type { BeltTile, BeltTileItem } from "./BeltTile"
import type { MergerTile } from "./MergerTile"
import type { MinerTile } from "./MinerTile"
import type { SplitterTile } from "./SplitterTile"


export abstract class BaseTile {
    pos: Vec2
    rotation: number

    constructor(pos: Vec2, rotation: number) {
        this.pos = pos
        this.rotation = rotation
    }

    getBeltableNeighbors() {
        let neighbors = this.getNeighbors()
        let beltNeighbors: BeltableTile[] = []

        for (let neighbor of neighbors) {
            if (isBeltableTile(neighbor)) {
                beltNeighbors.push(neighbor)
            }
        }
        return beltNeighbors
    }

    getNeighbors() {
        let neighbors: BaseTile[] = []

        let up = Game.world.grid.getTile(this.pos.add(new Vec2(0, -1)))
        if (up) neighbors.push(up)

        let right = Game.world.grid.getTile(this.pos.add(new Vec2(1, 0)))
        if (right) neighbors.push(right)

        let down = Game.world.grid.getTile(this.pos.add(new Vec2(0, 1)))
        if (down) neighbors.push(down)

        let left = Game.world.grid.getTile(this.pos.add(new Vec2(-1, 0)))
        if (left) neighbors.push(left)

        return neighbors
    }

    updateNeighbors() {
        let neighbors = this.getNeighbors()
        for (let n of neighbors) {
            if (isSplitterTile(n)) n.updateOutputs()
            if (isMergerTile(n)) n.updateInputs()
        }
    }

    drawBeltItem(item: BeltTileItem, itemPos: Vec2, ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        if (item.type == ItemType.coal) ctx.fillStyle = 'rgb(5, 5, 5)'
        if (item.type == ItemType.ironOre) ctx.fillStyle = 'rgb(200, 200, 255)'
        if (item.type == ItemType.siliconOre) ctx.fillStyle = 'rgb(15, 150, 150)'
        ctx.lineWidth = 0.01
        ctx.arc(itemPos.x, itemPos.y, 0.12, 0, Math.PI * 2)
        ctx.fill()
    }

    abstract draw(ctx: CanvasRenderingContext2D): void
    abstract get type(): TileType
}

export function isBeltTile(tile: Tile): tile is BeltTile {
    return tile.type == TileType.Belt
}

export type BeltableTile = BeltTile | SplitterTile | MergerTile
export function isBeltableTile(tile: Tile): tile is BeltableTile {
    return tile.type == TileType.Belt || tile.type == TileType.Splitter || tile.type == TileType.Merger
}


export function isSplitterTile(tile: Tile): tile is SplitterTile {
    return tile.type === TileType.Splitter
}

export function isMergerTile(tile: Tile): tile is MergerTile {
    return tile.type == TileType.Merger
}

export function isMinerTile(tile: Tile): tile is MinerTile {
    return tile.type == TileType.Miner
}
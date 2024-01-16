import { Vec2 } from "./Vec2"
import { BaseTile } from "./tiles/BaseTile"
import type { BeltTile } from "./tiles/BeltTile"
import type { MinerTile } from "./tiles/MinerTile"
import type { SplitterTile } from "./tiles/SplitterTile"

export class Grid {
    tiles: Tile[][]

    constructor() {
        this.tiles = []
    }

    createEmptyGrid(width: number, height: number) {
        for (let x = 0; x < width; x++) {
            this.tiles[x] = []
            for (let y = 0; y < height; y++) {
                let pos = new Vec2(x, y)
                this.tiles[x][y] = new EmptyTile(pos)
            }
        }
    }

    getTile(pos: Vec2): Tile | undefined {

        if (pos.x < 0 || pos.x >= this.tiles.length) return
        if (pos.y < 0 || pos.y >= this.tiles[0].length) return
        if (!this.tiles[pos.x]) return

        return this.tiles[pos.x][pos.y]
    }

    setTile(tile: Tile) {

        let pos = tile.pos
        if (pos.x < 1 || pos.x >= this.tiles.length - 1) return
        if (pos.y < 1 || pos.y >= this.tiles[0].length - 1) return
        this.tiles[pos.x][pos.y] = tile

        tile.updateNeighbors()
    }
}

export type Tile = BeltTile | MinerTile | EmptyTile | SplitterTile

export class EmptyTile extends BaseTile {
    constructor(pos: Vec2) {
        super(pos, 0)
    }

    get type(): TileType {
        return TileType.Empty
    }

    draw(ctx: CanvasRenderingContext2D): void {

    }
}

export enum TileType {
    Belt,
    Splitter,
    Merger,
    Miner,
    Empty,
}
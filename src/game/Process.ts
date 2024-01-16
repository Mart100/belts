import { Game } from "./Game"
import { TileType, type Tile } from "./Grid"
import { ItemType } from "./Types"
import type { Vec2 } from "./Vec2"
import { isBeltableTile, isMergerTile, isMinerTile, isSplitterTile } from "./tiles/BaseTile"
import { BeltTile, type BeltTileItem } from "./tiles/BeltTile"
import type { SplitterTile, SplitterTileItem } from "./tiles/SplitterTile"

export let lastTick = 0
export let tickCount = 0

const itemDistance = 25

export function tick() {

    let now = Date.now()
    let dt = now - lastTick
    lastTick = now
    tickCount += 1

    // Update game logic

    let beltUpdates: {
        pos: Vec2,
        items: BeltTileItem[]
    }[] = []

    let getTileUpdated = (tilePos: Vec2) => {
        let tileUpdated = beltUpdates.find(t => t.pos.equals(tilePos))
        if (!tileUpdated) {
            tileUpdated = { pos: tilePos, items: [] }
            beltUpdates.push(tileUpdated)
        }
        return tileUpdated
    }

    for (let x = 0; x < Game.world.grid.tiles.length; x++) {
        for (let y = 0; y < Game.world.grid.tiles[0].length; y++) {
            let tile = Game.world.grid.tiles[x][y]

            if (isMinerTile(tile)) {
                let outputTile = Game.world.grid.getTile(tile.outputPos())

                let lastMined = tile.tileData.lastMined
                if (tickCount - lastMined > tile.outputDelay) {

                    if (!outputTile || !isBeltableTile(outputTile)) continue
                    if (outputTile.isInputBlocked()) continue
                    if (!outputTile.inputPos().equals(tile.pos)) continue

                    let tileUpdated = getTileUpdated(outputTile.pos)
                    tileUpdated.items.push({ type: tile.tileData.output, progress: 0 })

                    tile.tileData.lastMined = tickCount
                }
            }

            else if (isBeltableTile(tile)) {

                if (tile.tileData.items.length === 0) continue

                let outN = Game.world.grid.getTile(tile.outputPos()) // outputNeighbor, next tile for items to move to
                if (outN && !isBeltableTile(outN)) outN = undefined
                if (outN?.inputPos().equals(tile.pos) === false && outN.type !== TileType.Merger) outN = undefined
                if (outN && isMergerTile(outN) && outN.outputPos().equals(tile.pos) === true) outN = undefined

                let tileUpdated = getTileUpdated(tile.pos)
                let tileItemsUpdated = tileUpdated.items

                // Move items
                for (let i = 0; i < tile.tileData.items.length; i++) {
                    let readItem = tile.tileData.items[i]
                    let item = { ...readItem }
                    tileItemsUpdated.push(item)
                    let nextItem = tile.tileData.items[i - 1]

                    if (isSplitterTile(tile) && (item as SplitterTileItem).direction !== undefined) {
                        let outputVec = tile.directionToOutputPos((item as SplitterTileItem).direction!)
                        outN = Game.world.grid.getTile(outputVec)
                        if (outN && !isBeltableTile(outN)) outN = undefined
                    }

                    if (nextItem) {
                        let diff = nextItem.progress - item.progress

                        let splitterDiffDirection = isSplitterTile(tile) && (item as SplitterTileItem).direction !== (nextItem as SplitterTileItem).direction
                        if (splitterDiffDirection) diff += 100

                        //if (isMergerTile(tile)) diff += 100

                        if (diff <= itemDistance) {
                            item.progress = nextItem.progress - itemDistance - 1
                        }
                    }

                    if (item.progress > 100 - itemDistance && outN) {
                        nextItem = outN.tileData.items[outN.tileData.items.length - 1]

                        if (nextItem && !isMergerTile(outN)) {
                            let diff = nextItem.progress + 100 - item.progress
                            if (diff <= itemDistance) {
                                item.progress = nextItem.progress + 100 - itemDistance - 1
                            }
                        }
                    }

                    if (item.progress >= 99) {
                        if (!outN || !isBeltableTile(outN)) continue

                        if ((item as any).direction) delete (item as any).direction

                        if (isMergerTile(outN)) {
                            let dir: 'forward' | 'left' | 'right'
                            if (outN.directionToInputPos('forward').equals(tile.pos)) dir = 'forward'
                            else if (outN.directionToInputPos('left').equals(tile.pos)) dir = 'left'
                            else if (outN.directionToInputPos('right').equals(tile.pos)) dir = 'right'
                            else continue

                            let newDirection = outN.merge(dir)
                            if (newDirection) (item as any).direction = newDirection

                            else continue
                        }

                        item.progress = 0

                        let outputTileUpdated = beltUpdates.find(update => update.pos.equals(outN!.pos))
                        if (!outputTileUpdated) {
                            outputTileUpdated = { pos: outN.pos, items: [] }
                            beltUpdates.push(outputTileUpdated)
                        }
                        outputTileUpdated.items.push(item)
                        let idx = tileItemsUpdated.indexOf(item)
                        tileItemsUpdated.splice(idx, 1)
                        continue

                    }

                    if (isSplitterTile(tile) && item.progress >= 49 && (item as SplitterTileItem).direction === undefined) {
                        let newDirection = tile.switchDirection()
                        if (newDirection) (item as SplitterTileItem).direction = newDirection
                        else continue
                    }

                    item.progress += 1
                    //console.log(item.progress)
                }

            }
        }
    }

    for (let update of beltUpdates) {
        let tile = Game.world.grid.tiles[update.pos.x][update.pos.y] as BeltTile
        update.items.sort((a, b) => b.progress - a.progress)
        tile.tileData.items = update.items
        //console.log(update)
    }

}
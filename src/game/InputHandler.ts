import { Game } from "./Game"
import { EmptyTile, TileType } from "./Grid"
import { Camera } from "./Renderer"
import { Vec2 } from "./Vec2"
import { selectedTool } from "../stores"
import { get } from "svelte/store"
import { getLine } from "./Utils"
import { BeltTile } from "./tiles/BeltTile"
import { SplitterTile } from "./tiles/SplitterTile"
import { MinerTile } from "./tiles/MinerTile"
import { MergerTile } from "./tiles/MergerTile"


export function onCanvasMouseDown(e: MouseEvent) {

    let inputData = Game.inputData
    let mousePos = new Vec2(e.clientX, e.clientY)
    let selectedToolVal = get(selectedTool)

    // left click
    if (e.button === 0) {

        if (inputData.minerMenu) {
            let worldPos = Camera.screenToWorld(mousePos)
            if (inputData.minerMenu.pos.equals(worldPos)) {
                let tile = Game.world.grid.getTile(worldPos) as MinerTile | undefined
                if (tile) return tile.menu.onClick(e)
            }
            inputData.minerMenu = null
        }
        if (selectedToolVal !== "none") {
            if (selectedToolVal === "belt") {
                inputData.beltDragging = { previousBelt: null }
                onCanvasMouseMove(e)

            } else {
                let worldPos = Camera.screenToWorld(mousePos)
                let tile
                if (selectedToolVal === "splitter") tile = new SplitterTile(worldPos, Game.inputData.tileRotation)
                if (selectedToolVal === "merger") tile = new MergerTile(worldPos, Game.inputData.tileRotation)
                if (selectedToolVal === "miner") tile = new MinerTile(worldPos, Game.inputData.tileRotation)
                if (tile) Game.world.grid.setTile(tile)
            }
        } else {
            // move camera
            Game.camera.dragging = {
                screenStart: mousePos.clone(),
                worldStart: Game.camera.pos.clone(),
            }
        }

    } else if (e.button === 2) {
        // right click
        if (selectedToolVal !== "none") {
            inputData.beltDragging = null
            selectedTool.update(v => "none")
        } else {
            inputData.rightMouseDown = true
            onCanvasMouseMove(e)
        }
    } else if (e.button === 1) {
        // middle click
        let worldPos = Camera.screenToWorld(mousePos)
        let tile = Game.world.grid.getTile(worldPos)
        console.log(tile)
    }
}

export function onCanvasMouseMove(e: MouseEvent) {

    let inputData = Game.inputData
    let mousePos = new Vec2(e.clientX, e.clientY)

    inputData.mousePos = mousePos

    if (inputData.minerMenu) {
        let worldPos = Camera.screenToWorld(mousePos)
        if (inputData.minerMenu.pos.equals(worldPos)) {
            let tile = Game.world.grid.getTile(worldPos) as MinerTile | undefined
            if (tile) return tile.menu.onHover(e)
        }
        (Game.world.grid.getTile(inputData.minerMenu.pos) as MinerTile).menu.reset()
        inputData.minerMenu = null

    }

    if (inputData.rightMouseDown) {
        let worldPos = Camera.screenToWorld(mousePos)

        Game.world.grid.setTile(new EmptyTile(worldPos))
    }

    if (Game.camera.dragging) {
        let offset = new Vec2(e.clientX, e.clientY).sub(Game.camera.dragging.screenStart)
        Game.camera.pos = Game.camera.dragging.worldStart.sub(offset.scale(1 / Game.camera.zoom))
    }
    if (inputData.beltDragging) {
        let worldPos = Camera.screenToWorld(mousePos)

        let beltDragging = inputData.beltDragging
        let prevBelt = beltDragging.previousBelt
        if (prevBelt == null || !worldPos.equals(prevBelt)) {
            let rotation = Game.inputData.tileRotation
            let newTiles = [worldPos]
            if (prevBelt && worldPos.sub(prevBelt).length() > 1) {
                newTiles = getLine(worldPos, prevBelt).reverse()
            }

            for (let tilePos of newTiles) {
                if (beltDragging.previousBelt !== null) {
                    rotation = (tilePos.sub(beltDragging.previousBelt).angle() / Math.PI * 2) + 1
                    Game.inputData.tileRotation = rotation
                    Game.world.grid.setTile(new BeltTile(beltDragging.previousBelt, rotation))
                }

                Game.world.grid.setTile(new BeltTile(tilePos, rotation))
                inputData.beltDragging.previousBelt = tilePos
            }
        }
    }
}

export function onCanvasMouseUp(e: MouseEvent) {

    let inputData = Game.inputData

    if (inputData.rightMouseDown) inputData.rightMouseDown = false

    if (Game.camera.dragging) {

        if (Game.camera.dragging.screenStart.equals(inputData.mousePos)) {

            let worldPos = Camera.screenToWorld(inputData.mousePos)
            let tile = Game.world.grid.getTile(worldPos)
            if (tile && tile.type === TileType.Miner) {
                inputData.minerMenu = { pos: worldPos }
            }
        }

        Game.camera.dragging = null

    }
    if (inputData.beltDragging) {
        inputData.beltDragging = null
    }
}

export function onCanvasKeyDown(e: KeyboardEvent) {
    if (e.key === "r") {
        Game.inputData.tileRotation = (Game.inputData.tileRotation + 1) % 4
    }
}

const maxZoom = 1000
const minZoom = 20

export function onCanvasScroll(e: WheelEvent) {

    let scroll = e.deltaY > 0 ? 0.90 : 1.1

    let previousZoom = Game.camera.zoom
    Game.camera.zoom *= scroll

    Game.camera.zoom = Math.max(minZoom, Math.min(Game.camera.zoom, maxZoom))
    if (Game.camera.zoom === minZoom || Game.camera.zoom === maxZoom) {
        scroll = Game.camera.zoom / previousZoom
    }

    let mousePos = new Vec2(e.clientX, e.clientY)
    let worldOffsetOld = Camera.screenToWorldPrecise(mousePos).sub(Game.camera.pos)
    let worldOffsetNew = worldOffsetOld.scale(scroll)

    let diff = worldOffsetNew.sub(worldOffsetOld)
    Game.camera.pos = Game.camera.pos.add(diff)

}

export class InputData {
    beltDragging: { previousBelt: Vec2 | null } | null = null
    mousePos: Vec2 = new Vec2(0, 0)
    tileRotation = 0
    rightMouseDown = false
    minerMenu: { pos: Vec2 } | null = null
}
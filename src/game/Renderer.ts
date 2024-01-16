import { get } from "svelte/store"
import { Game } from "./Game"
import { EmptyTile, TileType } from "./Grid"
import { Vec2 } from "./Vec2"
import { selectedTool } from "../stores"
import { tickCount } from "./Process"
import { BeltTile } from "./tiles/BeltTile"
import { SplitterTile } from "./tiles/SplitterTile"
import { MinerTile } from "./tiles/MinerTile"
import { MergerTile } from "./tiles/MergerTile"

export class Camera {
    pos: Vec2 = new Vec2(0, 0)
    zoom: number = 100
    dragging: {
        worldStart: Vec2,
        screenStart: Vec2,
    } | null = null

    getScreenOffset() {
        return this.pos.scale(this.zoom)
    }

    static worldToScreen(vec: Vec2) {
        return vec.sub(Game.camera.pos).scale(Game.camera.zoom).floor()
    }

    static screenToWorld(vec: Vec2) {
        return vec.scale(1 / Game.camera.zoom).add(Game.camera.pos).floor()
    }

    static screenToWorldPrecise(vec: Vec2) {
        return vec.scale(1 / Game.camera.zoom).add(Game.camera.pos)
    }
}

export function renderFrame(ctx: CanvasRenderingContext2D, width: number, height: number) {

    ctx.clearRect(0, 0, width, height)
    ctx.beginPath()

    let cam = Game.camera
    let inputData = Game.inputData

    // render grid lines
    ctx.beginPath()
    ctx.strokeStyle = 'rgb(100, 100, 100)'
    ctx.lineWidth = 1
    let xCameraGridOffset = ((cam.pos.x % 1) * cam.zoom)
    let yCameraGridOffset = ((cam.pos.y % 1) * cam.zoom)
    for (let i = -1; i < (width / cam.zoom) + 1; i++) {
        ctx.moveTo(i * cam.zoom - xCameraGridOffset, 0)
        ctx.lineTo(i * cam.zoom - xCameraGridOffset, height)
    }
    for (let i = -1; i < (height / cam.zoom) + 1; i++) {
        ctx.moveTo(0, i * cam.zoom - yCameraGridOffset)
        ctx.lineTo(width, i * cam.zoom - yCameraGridOffset)
    }
    ctx.stroke()

    // render tiles
    let grid = Game.world.grid
    for (let x = 0; x < grid.tiles.length; x++) {
        for (let y = 0; y < grid.tiles[x].length; y++) {
            let tile = grid.tiles[x][y]
            tile.draw(ctx)
        }
    }

    // render selected tool blueprint
    let selectedToolVal = get(selectedTool)

    if (selectedToolVal !== 'none') {
        let rotation = Game.inputData.tileRotation
        let mouseWorldPos = Camera.screenToWorld(inputData.mousePos)
        let screenWorldPos = Camera.worldToScreen(mouseWorldPos)
        ctx.save()
        //ctx.filter = "sepia(100%) contrast(50%) hue-rotate(180deg) saturate(1000%)"
        ctx.fillStyle = 'rgba(40, 200, 225, 0.6)'
        ctx.fillRect(screenWorldPos.x, screenWorldPos.y, cam.zoom, cam.zoom)
        if (selectedToolVal === 'belt') new BeltTile(mouseWorldPos, rotation).draw(ctx)
        if (selectedToolVal === 'miner') new MinerTile(mouseWorldPos, rotation).draw(ctx)
        if (selectedToolVal === 'splitter') new SplitterTile(mouseWorldPos, rotation).draw(ctx)
        if (selectedToolVal === 'merger') new MergerTile(mouseWorldPos, rotation).draw(ctx)
        ctx.restore()

        ctx.drawImage(Game.assets[selectedToolVal], inputData.mousePos.x, inputData.mousePos.y, cam.zoom * 0.5, cam.zoom * 0.5)
    }

}
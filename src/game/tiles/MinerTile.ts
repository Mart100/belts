import { Game } from "../Game"
import { TileType } from "../Grid"
import { tickCount } from "../Process"
import { Camera } from "../Renderer"
import { ItemType } from "../Types"
import { Vec2 } from "../Vec2"
import { BaseTile } from "./BaseTile"

export class MinerTile extends BaseTile {
    menu: MinerTileMenu
    tileData: {
        lastMined: number
        level: number
        output: ItemType
    } = {
            lastMined: tickCount,
            level: 1,
            output: ItemType.coal
        }

    constructor(pos: Vec2, rotation: number) {
        super(pos, rotation)
        this.menu = new MinerTileMenu(this)
    }

    get type(): TileType {
        return TileType.Miner
    }

    get outputDelay() {
        return 500 / this.tileData.level
    }

    outputPos() {
        return this.pos.add(new Vec2(0, -1).rotate(this.rotation * Math.PI / 2))
    }

    draw(ctx: CanvasRenderingContext2D): void {

        let tile = this
        let cam = Game.camera
        let screenPos = Camera.worldToScreen(new Vec2(tile.pos.x, tile.pos.y))
        let lw = 0.01

        let corners = [new Vec2(-0.5 + lw, -0.5), new Vec2(0.5 - lw, -0.5), new Vec2(0.5 - lw, 0.5 - lw), new Vec2(-0.5 + lw, 0.5 - lw)]
        ctx.save()
        ctx.translate(screenPos.x + 0.5 * cam.zoom + 0.5, screenPos.y + 0.5 * cam.zoom + 0.5)
        ctx.scale(cam.zoom, cam.zoom)
        ctx.rotate((tile.rotation) * Math.PI / 2)

        ctx.strokeStyle = 'rgb(255, 255, 255)'
        ctx.fillStyle = 'rgb(255, 255, 255)'
        ctx.lineWidth = lw * 2

        ctx.beginPath()
        ctx.moveTo(corners[0].x, corners[0].y)
        ctx.lineTo(corners[3].x, corners[3].y)
        ctx.lineTo(corners[2].x, corners[2].y)
        ctx.lineTo(corners[1].x, corners[1].y)
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(0, 0, 0.3, 0, Math.PI * 2)
        ctx.stroke()

        let progress = Math.min((tickCount - tile.tileData.lastMined) / this.outputDelay, 1)
        ctx.beginPath()
        ctx.arc(0, 0, 0.3 * progress, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()

        if (Game.inputData.minerMenu?.pos.equals(tile.pos)) this.menu.draw(ctx)

    }
}

export class MinerTileMenu {

    page: 'main' | 'changeOutput' = 'main'
    tile: MinerTile
    buttons: {
        main: {
            pos: Vec2,
            size: Vec2,
            text: string,
            hover: boolean,
            action: (() => void)
        }[],
        changeOutput: {
            pos: Vec2,
            size: Vec2,
            text: string,
            hover: boolean,
            action: (() => void)
        }[]
    } = {
            main: [
                {
                    pos: new Vec2(0.05, 0.85),
                    size: new Vec2(0.3, 0.1),
                    text: 'Upgrade',
                    hover: false,
                    action: () => {
                        this.tile.tileData.level++
                    }
                },
                {
                    pos: new Vec2(0.55, 0.85),
                    size: new Vec2(0.4, 0.1),
                    text: 'Change Output',
                    hover: false,
                    action: () => {
                        this.page = 'changeOutput'
                    }
                }
            ],
            changeOutput: [

            ]
        }

    constructor(tile: MinerTile) {
        this.tile = tile

        // fill changeOutput buttons
        let outputs = [ItemType.coal, ItemType.ironOre, ItemType.siliconOre]
        for (let i = 0; i < outputs.length; i++) {
            let output = outputs[i]
            this.buttons.changeOutput.push({
                pos: new Vec2(0.05, 0.25 + 0.15 * i),
                size: new Vec2(0.9, 0.1),
                text: ItemType[output],
                hover: false,
                action: () => {
                    this.tile.tileData.output = output
                    this.page = 'main'
                }
            })
        }
    }

    draw(ctx: CanvasRenderingContext2D) {

        let tile = this.tile
        let cam = Game.camera
        let screenPos = Camera.worldToScreen(new Vec2(tile.pos.x, tile.pos.y))

        ctx.save()
        ctx.translate(screenPos.x + 0.5, screenPos.y + 0.5)
        ctx.scale(cam.zoom, cam.zoom)

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
        ctx.beginPath()
        ctx.rect(0, 0, 1, 1)
        ctx.fill()

        ctx.fillStyle = 'white'
        ctx.font = '0.1px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        if (this.page == 'main') {
            ctx.fillText(`Miner MK.${tile.tileData.level}`, 0.5, 0.2)

            ctx.font = '0.05px Arial'
            ctx.fillText(`Speed: ${tile.tileData.level} per second`, 0.5, 0.4)
            ctx.fillText(`Output: ${ItemType[tile.tileData.output]}`, 0.5, 0.5)
        }

        else if (this.page == 'changeOutput') {
            ctx.fillText(`Set output to:`, 0.5, 0.1)
        }

        for (let b of this.buttons[this.page]) {
            if (b.hover) ctx.fillStyle = 'rgb(0, 150, 0)'
            else ctx.fillStyle = 'rgb(0, 255, 0)'
            ctx.beginPath()
            ctx.rect(b.pos.x, b.pos.y, b.size.x, b.size.y)
            ctx.fill()
            ctx.fillStyle = 'black'
            ctx.font = '0.05px Arial'
            ctx.fillText(b.text, b.pos.x + b.size.x / 2, 0.01 + b.pos.y + b.size.y / 2)
        }

        ctx.restore()
    }

    onClick(e: MouseEvent) {
        let tile = this.tile
        let tileScreenPos = Camera.worldToScreen(new Vec2(tile.pos.x, tile.pos.y))
        let relMousePos = new Vec2(e.clientX - tileScreenPos.x, e.clientY - tileScreenPos.y).scale(1 / Game.camera.zoom)
        let buttons = this.buttons[this.page]

        for (let button of buttons) {
            if (relMousePos.x > button.pos.x && relMousePos.x < button.pos.x + button.size.x &&
                relMousePos.y > button.pos.y && relMousePos.y < button.pos.y + button.size.y) {
                button.action()
            }
        }

    }

    onHover(e: MouseEvent) {
        let tile = this.tile
        let tileScreenPos = Camera.worldToScreen(new Vec2(tile.pos.x, tile.pos.y))
        let relMousePos = new Vec2(e.clientX - tileScreenPos.x, e.clientY - tileScreenPos.y).scale(1 / Game.camera.zoom)
        let buttons = this.buttons[this.page]

        buttons.forEach(button => button.hover = false)

        for (let button of buttons) {
            if (relMousePos.x > button.pos.x && relMousePos.x < button.pos.x + button.size.x &&
                relMousePos.y > button.pos.y && relMousePos.y < button.pos.y + button.size.y) {
                button.hover = true
            }
        }

    }

    reset() {
        this.page = 'main'
    }
}
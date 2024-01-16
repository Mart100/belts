import { InputData } from "./InputHandler"
import { Camera } from "./Renderer"
import { World } from "./World"

import belt from "../assets/belt.png"
import splitter from "../assets/splitter.png"
import merger from "../assets/merger.png"
import miner from "../assets/miner.png"

interface Assets {
    belt: HTMLImageElement
    splitter: HTMLImageElement
    merger: HTMLImageElement
    miner: HTMLImageElement
}

export class Game {

    static camera: Camera
    static world: World
    static inputData: InputData
    static assets: Assets


    static init() {
        this.camera = new Camera()
        this.world = new World()
        this.inputData = new InputData()

        this.loadAssets()
    }

    static load() {
        this.world.load()
    }

    static loadAssets() {

        let assets = {
            belt: new Image(),
            splitter: new Image(),
            merger: new Image(),
            miner: new Image(),
        }

        assets.belt.src = belt
        assets.splitter.src = splitter
        assets.merger.src = merger
        assets.miner.src = miner


        this.assets = assets
    }

}
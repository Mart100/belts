import { Grid } from "./Grid"

export class World {
    grid: Grid

    constructor() {
        this.grid = new Grid()

    }

    load() {
        this.grid.createEmptyGrid(100, 100)
    }
}
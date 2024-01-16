import { writable, type Writable } from "svelte/store"
import { type ToolbeltTools } from "./lib/Toolbelt.svelte"

export const selectedTool = writable("none" as ToolbeltTools)
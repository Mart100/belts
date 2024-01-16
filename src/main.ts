import './app.css'
import App from './App.svelte'
import { Game } from './game/Game'

Game.init()

const app = new App({
  target: document.getElementById('app')!,
})

export default app

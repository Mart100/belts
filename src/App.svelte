<script lang="ts">
  import { onMount } from "svelte";
  import { renderFrame } from "./game/Renderer";
  import Toolbelt from "./lib/Toolbelt.svelte";
  import {
    onCanvasKeyDown,
    onCanvasMouseDown,
    onCanvasMouseMove,
    onCanvasMouseUp,
    onCanvasScroll,
  } from "./game/InputHandler";
  import { tick } from "./game/Process";
  import { Game } from "./game/Game";

  onMount(() => {
    Game.load();

    const canvas = document.querySelector("canvas")!;
    const ctx = canvas.getContext("2d")!;

    let frame = requestAnimationFrame(function loop(t) {
      frame = requestAnimationFrame(loop);
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      ctx.translate(-0.5, -0.5);
      renderFrame(ctx, canvas.width, canvas.height);
    });

    let process = setInterval(() => {
      tick();
    }, 10);

    return () => {
      cancelAnimationFrame(frame);
      clearInterval(process);
    };
  });
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<main
  on:keydown={onCanvasKeyDown}
  on:mousemove={onCanvasMouseMove}
  on:contextmenu|preventDefault
  tabindex="0"
>
  <canvas
    on:mousedown={onCanvasMouseDown}
    on:mouseup={onCanvasMouseUp}
    on:wheel={(e) => onCanvasScroll(e)}
  />
  <Toolbelt />
</main>

<style type="scss">
  canvas {
    width: 100%;
    height: 100%;
  }
</style>

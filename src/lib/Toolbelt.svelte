<script lang="ts" context="module">
    export type ToolbeltTools =
        | "belt"
        | "splitter"
        | "merger"
        | "miner"
        | "none";
</script>

<script lang="ts">
    import belt from "../assets/belt.png";
    import splitter from "../assets/splitter.png";
    import merger from "../assets/merger.png";
    import miner from "../assets/miner.png";
    import { selectedTool } from "../stores";

    const tools: { name: ToolbeltTools; img: string }[] = [
        { name: "belt", img: belt },
        { name: "splitter", img: splitter },
        { name: "merger", img: merger },
        { name: "miner", img: miner },
    ];
</script>

<div id="toolbelt">
    {#each tools as tool, i}
        <button
            class=""
            aria-current={$selectedTool === tool.name ? "true" : undefined}
            on:click={() => {
                $selectedTool = tool.name;
            }}
        >
            <img src={tool.img} alt={tool.name} />
        </button>
    {/each}
</div>

<style lang="scss">
    #toolbelt {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        bottom: 20px;
        width: auto;
        padding: 10px 50px;
        height: 90px;
        border-radius: 20px;
        background-color: rgb(10, 10, 10);
        display: flex;
        justify-content: center;
        align-items: center;
        box-shadow: 5px 5px 20px rgb(5, 5, 5);
        transition-duration: 200ms;

        &:hover {
            box-shadow: 5px 5px 10px rgb(5, 5, 5);
        }

        button {
            width: 90px;
            height: 90px;
            padding: 5px;
            border-radius: 10px;
            cursor: pointer;
            transition-duration: 200ms;
            border: none;
            background-color: transparent;
            margin: 0 10px;
            outline: none;

            img {
                width: 80px;
                height: 80px;
            }

            &:hover {
                background-color: rgb(20, 20, 20);
            }
        }
        button[aria-current="true"] {
            background-color: rgb(30, 30, 30);
        }
    }
</style>

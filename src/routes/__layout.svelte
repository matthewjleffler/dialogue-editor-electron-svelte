<script lang="ts">
  import { ElectronEvent, electronListen } from '$modules/electron';
  import { onMount } from 'svelte';
  import '../app.css';

  let ready: boolean = false;
  onMount(() => (ready = true));

  electronListen(ElectronEvent.ElectronLog, onElectronLog);

  function onElectronLog(message: string, ...args: unknown[]) {
    console.log(message, ...args);
  }
</script>

<div class="absolute flex flex-col w-full top-0 bottom-0">
  <div class="drag z-[100] h-[28px] leading-[28px] w-full text-center">
    <p class="text-white m-0 select-none">Dialogue Editor</p>
  </div>

  <div class="relative w-full h-full">
    {#if ready}
      <slot />
    {/if}
  </div>
</div>

<style>
  .drag {
    -webkit-app-region: drag;
  }
</style>

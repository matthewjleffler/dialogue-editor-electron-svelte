<script lang="ts">
  import { ElectronEvent, electronListen } from '$modules/electron';
  import { projectTitle, unsavedExport, unsavedProject } from '$stores';
  import { onMount } from 'svelte';
  import '../app.css';

  let ready: boolean = false;

  $: title = updateTitle($projectTitle, $unsavedProject, $unsavedExport);

  onMount(() => (ready = true));

  electronListen(ElectronEvent.ElectronLog, onElectronLog);

  function onElectronLog(message: string, ...args: unknown[]) {
    console.log(message, ...args);
  }

  function updateTitle(title: string, unsavedProject: boolean, unsavedExport: boolean): string {
    const unsaved = unsavedProject || unsavedExport;
    const result = `Dialogue Editor - ${title}${unsaved ? ' -' : ''}${
      unsavedProject ? ' [Unsaved]' : ''
    }${unsavedExport ? ' [Unexported]' : ''}`;
    return result;
  }
</script>

<div class="absolute flex flex-col w-full top-0 bottom-0">
  <div
    class="drag z-[100] h-[28px] leading-[28px] w-full text-center flex justify-center select-none"
  >
    <p>{title}</p>
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

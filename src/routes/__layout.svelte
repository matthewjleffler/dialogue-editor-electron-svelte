<script lang="ts">
  import { electronDispatch, ElectronEvent, electronListen } from '$modules/electron';
  import { projectTitle, unsavedExport, unsavedProject } from '$stores';
  import { onMount } from 'svelte';
  import '../app.css';

  let ready: boolean = false;

  $: updateTitle($projectTitle, $unsavedProject, $unsavedExport);

  onMount(() => (ready = true));

  electronListen(ElectronEvent.ElectronLog, onElectronLog);

  function onElectronLog(message: string, ...args: unknown[]) {
    console.log(message, ...args);
  }

  function updateTitle(title: string, unsavedProject: boolean, unsavedExport: boolean) {
    const unsaved = unsavedProject || unsavedExport;
    const result = `Dialogue Editor - ${title}${unsaved ? ' -' : ''}${
      unsavedProject ? ' [Unsaved]' : ''
    }${unsavedExport ? ' [Unexported]' : ''}`;
    electronDispatch(ElectronEvent.SetTitle, result);
  }
</script>

<div class="absolute flex flex-col w-full top-0 bottom-0">
  {#if ready}
    <slot />
  {/if}
</div>

<style>
  .drag {
    -webkit-app-region: drag;
  }
</style>

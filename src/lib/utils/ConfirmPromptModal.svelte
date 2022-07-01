<script lang="ts">
  import { promptDispatcher, PromptEvent, type ConfirmPromptData } from '$modules/prompt';
  import { onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';

  const duration = 100;

  let data: ConfirmPromptData;

  const cleanup = promptDispatcher.addListener(PromptEvent.ShowConfirmPrompt, onShowPrompt);
  onDestroy(cleanup);

  function onShowPrompt(newData: ConfirmPromptData) {
    if (data) {
      throw 'Prompt already displayed';
    }
    data = newData;
  }

  function onKeyDown(e: KeyboardEvent) {
    if (!data) {
      return;
    }

    switch (e.code) {
      case 'Escape':
        if (data.button1) {
          clickButton1();
        } else {
          clickButton0();
        }
        return;
      case 'Enter':
        clickButton0();
        break;
    }
  }

  function clickButton0() {
    resolve(0);
  }

  function clickButton1() {
    resolve(1);
  }

  function resolve(result: number) {
    const resolver = data.resolver;
    data = null;
    resolver(result);
  }
</script>

<svelte:window on:keydown={onKeyDown} />

{#if data}
  <div
    in:fade={{ duration }}
    out:fade={{ duration }}
    class="absolute top-0 left-0 right-0 bottom-0 bg-black/40 text-white/80 flex items-center justify-center"
  >
    <div class="w-[500px] rounded-md bg-menu-grey shadow-lg flex flex-col p-2">
      <h1 class="text-center font-semibold">{data.header}</h1>
      <p class="mt-2 ml-1">{@html data.prompt}</p>
      <div class="mt-4 flex flex-row w-full gap-8 justify-center">
        <button on:click={clickButton0}>{data.button0}</button>
        {#if data.button1}
          <button on:click={clickButton1}>{data.button1}</button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style lang="postcss">
  button {
    @apply w-[100px] h-7 bg-search-close-grey text-white rounded-md;
  }
</style>

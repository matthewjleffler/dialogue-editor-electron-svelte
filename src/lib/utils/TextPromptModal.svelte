<script lang="ts">
  import { promptDispatcher, PromptEvent, type TextPromptData } from '$modules/prompt';
  import { onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import TextField from './TextField.svelte';

  const duration = 100;

  let value: string;
  let input: HTMLInputElement;
  let data: TextPromptData;
  let invalid: boolean;

  $: onchange(value);
  $: input && input.focus(); // When input is assigned, focus it

  const cleanup = promptDispatcher.addListener(PromptEvent.ShowTextPrompt, onShowPrompt);
  onDestroy(cleanup);

  function onShowPrompt(newData: TextPromptData) {
    if (data) {
      throw 'Prompt already displayed';
    }
    data = newData;
    data.placeholder = data.placeholder ?? '';
    value = data.defaultValue;
  }

  function onchange(value: string) {
    if (!data) {
      return;
    }
    if (data.validator) {
      invalid = !data.validator(value);
      return;
    }
    invalid = false;
    return;
  }

  function onKeyDown(e: KeyboardEvent) {
    switch (e.code) {
      case 'Escape':
        clickCancel();
        return;
      case 'Enter':
        clickAccept();
        break;
    }
  }

  function clickAccept() {
    if (invalid) {
      return;
    }
    resolve(value);
  }

  function clickCancel() {
    resolve(null);
  }

  function resolve(result: string) {
    const resolver = data.resolver;
    data = null;
    resolver(result);
  }

  function onLoseFocus() {
    input.focus();
  }
</script>

{#if data}
  <div
    in:fade={{ duration }}
    out:fade={{ duration }}
    on:keydown={onKeyDown}
    class="absolute top-0 left-0 right-0 bottom-0 bg-black/40 text-white/80 flex items-center justify-center"
  >
    <div class="w-[500px] rounded-md bg-menu-grey shadow-lg flex flex-col p-2">
      <h1 class="text-center font-semibold">{data.header}</h1>
      {#if data.prompt}
        <p class="mt-2 ml-1">{data.prompt}</p>
      {/if}
      <div class="mt-2">
        <TextField bind:value placeholder={data.placeholder} bind:input on:blur={onLoseFocus} />
      </div>
      <div class="mt-4 flex flex-row w-full gap-8 justify-center">
        <button class:invalid on:click={clickAccept}>Accept</button>
        <button on:click={clickCancel}>Cancel</button>
      </div>
    </div>
  </div>
{/if}

<style lang="postcss">
  button {
    @apply w-[100px] h-7 bg-search-close-grey text-white rounded-md;
  }

  .invalid {
    @apply pointer-events-none opacity-40;
  }
</style>

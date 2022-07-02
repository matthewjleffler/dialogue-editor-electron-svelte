<script lang="ts">
  import type { Page } from '$modules/translationData';
  import { replaceAll } from '$modules/utils';
  import { setUnsaved } from '$stores';
  import { createEventDispatcher } from 'svelte';

  export let page: Page;
  export let index: number;
  let value: string;
  let charCount: number;
  let deleteButton: HTMLButtonElement;

  const escapedNewline = '\\n';
  const htmlNewline = '\n';
  const eventAddNewPage = 'addpage';
  const eventDeletePage = 'deletepage';
  const dispatcher = createEventDispatcher();

  $: updatePageData(page);
  $: onValueChange(value);

  function updatePageData(page: Page) {
    const newRaw = page.text ?? '';
    const unEscaped = replaceAll(newRaw, escapedNewline, htmlNewline);
    value = unEscaped;
  }

  function onValueChange(newValue: string) {
    value = newValue ?? '';
    charCount = value.length;

    const escapedText = replaceAll(newValue, htmlNewline, escapedNewline);
    const isChanged = escapedText !== page.text;
    if (isChanged) {
      page.text = escapedText;
      setUnsaved(); // Undo/redo is tracked separately for this text element
    }
  }

  function onClickAddPrev() {
    dispatcher(eventAddNewPage, index);
  }

  function onClickAddNext() {
    dispatcher(eventAddNewPage, index + 1);
  }

  function onClickDelete() {
    deleteButton.blur(); // Unfocus to prevent repeated enter presses in the modal
    dispatcher(eventDeletePage, index);
  }
</script>

<div class="flex flex-col">
  <div class="flex flex-row">
    <p class="w-1/2">Page {index + 1}</p>
    <p class="w-1/2">Characters {charCount}</p>
  </div>
  <textarea
    bind:value
    spellcheck={true}
    maxlength={37 * 7}
    class="w-[268px] h-[85px] bg-page-back resize-none box-border font-mono border-none outline-none my-1"
  />
  <div class="flex flex-row justify-between">
    <button on:click={onClickAddPrev}>{'<+'}</button>
    <button bind:this={deleteButton} on:click={onClickDelete}>{'X'}</button>
    <button on:click={onClickAddNext}>{'+>'}</button>
  </div>
</div>

<style lang="postcss">
  button {
    @apply bg-search-close-grey px-2 align-text-top rounded-sm text-xs;
  }
</style>

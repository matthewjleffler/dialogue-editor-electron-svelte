<script lang="ts">
  export let value: string = '';
  export let placeholder: string;
  export let spellcheck = false;
  export let input: HTMLInputElement = null;

  function onClear() {
    value = '';
  }
</script>

<div class="flex bg-search-grey rounded-md p-1 h-6">
  <input
    class="w-full bg-transparent border-none outline-none text-white/80 placeholder-search"
    bind:value
    bind:this={input}
    on:blur
    {spellcheck}
    {placeholder}
  />
  <button
    class="h-full w-[15px] rounded-full text-white/80 bg-search-close-grey text-xxs"
    on:click={onClear}
  >
    X
  </button>
</div>

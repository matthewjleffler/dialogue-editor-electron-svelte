<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import TextField from './TextField.svelte';

  export let search: string;

  const eventVal = 'change';
  const dispatcher = createEventDispatcher();
  let value: string;

  $: dispatcher(eventVal, value);
</script>

<TextField placeholder={`Search ${search}:`} bind:value />

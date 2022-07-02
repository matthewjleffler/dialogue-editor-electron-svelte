<script lang="ts">
  import { leftPaneWidth } from '$modules/constants';
  import PageView from '$lib/page/PageView.svelte';
  import SearchBar from '$lib/utils/SearchBar.svelte';
  import TreeView from '$lib/tree/TreeView.svelte';
  import { filterId, filterText } from '$stores';

  function onSearchId(e: CustomEvent) {
    const value = e.detail;
    filterId.set(value);
  }

  function onSearchText(e: CustomEvent) {
    const value = e.detail;
    filterText.set(value);
  }
</script>

<div class="relative flex w-full h-full min-h-0">
  <div class="flex flex-col p-1 w-[var(--width)] bg-left-grey" style="--width: {leftPaneWidth}px">
    <SearchBar search={'Ids'} on:change={onSearchId} />
    <TreeView />
  </div>
  <div class="flex flex-col flex-1 p-1 bg-right-grey h-full">
    <SearchBar search={'Text'} on:change={onSearchText} />
    <PageView />
  </div>
</div>

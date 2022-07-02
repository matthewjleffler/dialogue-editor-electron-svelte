<script lang="ts">
  import { electronDispatch, ElectronEvent } from '$modules/electron';
  import { TreeEvent, treeEventDispatcher, type TreeNodeItem } from '$modules/tree';
  import type { TreeEntry } from '$modules/treeData';
  import { getRegionFromEntry } from '$modules/utils';
  import { activeRegion, treeActiveEntry, treeActiveNode, treeContextNode } from '$stores';
  import { onDestroy } from 'svelte';

  export let item: TreeNodeItem;
  let count: number;

  const cleanupChange = treeEventDispatcher.addListener(TreeEvent.RefreshEntry, onRefreshEntry);
  onDestroy(cleanupChange);

  $: arrowDown = !item.collapsed;
  $: selected = item == $treeActiveNode;
  $: active = activeEntryInChildren(item, $treeActiveEntry);
  $: onItemChanged(item);

  function onRefreshEntry(entry: TreeEntry) {
    if (!item || !entry || !item.entry || item.entry !== entry) {
      return;
    }
    // There was a change
    onItemChanged(item);
  }

  function activeEntryInChildren(node: TreeNodeItem, active: TreeEntry): boolean {
    if (!active || !node) {
      return;
    }
    if (node.entry == active) {
      return true;
    }
    if (node.children) {
      for (const child of node.children) {
        if (activeEntryInChildren(child, active)) {
          return true;
        }
      }
    }
    return false;
  }

  function onItemChanged(newItem: TreeNodeItem) {
    count = 0;

    const { entry } = newItem;
    if (!entry) {
      return;
    }

    // Find the number of pages for this region
    const region = getRegionFromEntry(entry, $activeRegion);
    if (region) {
      const regionPages = region.page;
      if (regionPages) {
        count = regionPages.length;
      }
    }
  }

  function onClickExpand() {
    item.collapsed = !item.collapsed;
  }

  function onClickItem() {
    if (item.entry !== undefined) {
      treeActiveEntry.set(item.entry);
    } else {
      treeActiveEntry.set(null);
    }
  }

  function onRightClick(e: MouseEvent) {
    e.preventDefault();
    treeContextNode.set(item);
    electronDispatch(ElectronEvent.OpenContextRightClick);
  }
</script>

{#if !item.entry}
  {#if item.children}
    <span
      class="row"
      class:active
      class:selected
      on:click={onClickExpand}
      on:contextmenu={onRightClick}
    >
      <span class="frame">
        <span class="cursor-pointer inline-block" class:arrowDown>&#x25b6</span>
      </span>
      {item.module}
    </span>
    {#if !item.collapsed}
      {#each item.children as child}
        <div class="ml-2 flex flex-col gap-1">
          <svelte:self item={child} />
        </div>
      {/each}
    {/if}
  {:else}
    <span class="row" class:active class:selected on:contextmenu={onRightClick}>
      <span class="frame" />
      {item.module}
    </span>
  {/if}
{:else}
  <span
    class="row"
    class:active-entry={active}
    class:selected
    on:click={onClickItem}
    on:contextmenu={onRightClick}
  >
    <span class="frame" />
    {item.module}
    <div class="flex-1" />
    <div class="w-[30px] h-full">{count}</div>
  </span>
{/if}

<style lang="postcss">
  .row {
    @apply flex w-full cursor-pointer select-none text-white/80 hover:text-white;
  }

  .selected {
    background-color: #666666;
    @apply rounded-sm;
  }

  .active {
    @apply text-blue-300 hover:text-blue-200;
  }

  .active-entry {
    @apply text-blue-400 hover:text-blue-300;
  }

  .frame {
    @apply flex w-[15px] h-full items-center justify-center;
  }

  .arrowDown {
    transform: rotate(90deg);
  }
</style>

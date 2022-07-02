<script lang="ts">
  import { displayConfirmPrompt } from '$modules/prompt';
  import { TreeEvent, treeEventDispatcher } from '$modules/tree';
  import type { Page, Region } from '$modules/translationData';
  import { getRegionFromEntry, replaceAll } from '$modules/utils';
  import { activeRegion, treeActiveEntry } from '$stores';
  import PageDisplay from './PageDisplay.svelte';
  import { L } from '$modules/localization';

  let pages: Page[];

  $: region = getRegionFromEntry($treeActiveEntry, $activeRegion);
  $: getPagesForRegion(region);

  function entryChanged() {
    getPagesForRegion(region);
    treeEventDispatcher.dispatch(TreeEvent.RefreshEntry, $treeActiveEntry);
  }

  function getPagesForRegion(region: Region) {
    pages = region?.page;
  }

  function pushNewPage(event: CustomEvent) {
    if (!pages) {
      return;
    }
    const index: number = event.detail;
    pages.splice(index, 0, { text: '' });
    entryChanged();
  }

  async function deletePage(event: CustomEvent) {
    if (!pages) {
      return;
    }
    if (pages.length <= 1) {
      await displayConfirmPrompt(L.InvalidAction, L.InvalidDeleteLastPage, L.Okay);
      return;
    }

    const index: number = event.detail;
    const newline = replaceAll(pages[index].text, '\\n', '<br>');
    const result = await displayConfirmPrompt(
      L.HeaderDeletePage,
      `${L.PromptDeletePage} ${index + 1}?<br><br>"${newline}"`,
      L.Yes,
      L.No,
    );
    if (result === 1) {
      // No
      return;
    }

    pages.splice(index, 1);
    entryChanged();
  }
</script>

<div class="flex overflow-auto mt-2 p-2 pt-0 pr-2 gap-2 flex-wrap flex-row">
  {#if pages}
    {#each pages as page, index}
      <PageDisplay {page} {index} on:addpage={pushNewPage} on:deletepage={deletePage} />
    {/each}
  {/if}
</div>

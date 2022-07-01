<script lang="ts">
  import MainLayout from '$lib/MainLayout.svelte';
  import MenuBar from '$lib/MenuBar.svelte';
  import ConfirmPromptModal from '$lib/utils/ConfirmPromptModal.svelte';
  import TextPromptModal from '$lib/utils/TextPromptModal.svelte';
  import {
    electronDispatch,
    ElectronEvent,
    electronListen,
    type SaveMessage,
    type SaveRequest,
  } from '$modules/electron';
  import type { TreeData, TreeEntry, TreeGroup, TreePage, TreeRegion } from '$modules/treeData';
  import type {
    TreeXmlEntry,
    TreeXmlGroup,
    TreeXmlPage,
    TreeXmlRegion,
    TreeXmlRoot,
  } from '$modules/treeXmlData';
  import { getArrayProperty, getItemPath } from '$modules/utils';
  import { activeRegion, regionList, treeActiveNode, treeData } from '$stores';
  import { onMount } from 'svelte';

  onMount(() => {
    electronListen(ElectronEvent.TreeChange, onTreeDataChanged);
    electronListen(ElectronEvent.GetProjectExport, onGetProjectExportRequest);
    electronDispatch(ElectronEvent.ReloadLastProject);
  });

  function onGetProjectExportRequest(request: SaveRequest) {
    const message: SaveMessage = { request, data: $treeData };
    electronDispatch(ElectronEvent.ReceiveProjectExport, message);
  }

  function onTreeDataChanged(root: TreeXmlRoot) {
    const data = root.data; // Unwrap top level
    const parsedRegions: string[] = [];
    const regions = getArrayProperty(data.info.regions.region);
    for (const parsedRegion of regions) {
      parsedRegions.push(parsedRegion._text);
    }
    const loadedData: TreeData = {
      info: {
        version: data.info.version._text,
        activeregion: data.info.activeregion._text,
        regions: parsedRegions,
        name: data.info.name._text,
      },
      group: [],
    };
    const groups = getArrayProperty(data.group);
    buildParsedGroupsRecursive(loadedData, groups);

    treeData.set(loadedData);
    treeActiveNode.set(null);
    regionList.set(loadedData.info.regions);
    activeRegion.set(loadedData.info.activeregion);
  }

  function buildParsedGroupsRecursive(parent: TreeData | TreeGroup, parsedGroup: TreeXmlGroup[]) {
    if (parsedGroup === null) {
      // Nothing in the parent group
      return;
    }
    for (const group of parsedGroup) {
      const newGroup: TreeGroup = {
        id: group._attributes.id,
        mod: group._attributes.mod,
        group: [],
        entry: [],
        parent: parent,
        path: '',
      };
      newGroup.path = getItemPath(newGroup);
      parent.group.push(newGroup);
      const entries = getArrayProperty(group.entry);
      buildParsedEntry(newGroup, entries);
      const groups = getArrayProperty(group.group);
      buildParsedGroupsRecursive(newGroup, groups);
    }
  }

  function buildParsedEntry(parent: TreeGroup, parsedEntry: TreeXmlEntry[]) {
    if (parsedEntry === null) {
      // No entries in this group
      return;
    }
    for (const entry of parsedEntry) {
      const newEntry: TreeEntry = {
        id: entry._attributes.id,
        mod: entry._attributes.mod,
        region: [],
        parent: parent,
        path: '',
      };
      newEntry.path = getItemPath(newEntry);
      parent.entry.push(newEntry);
      const regions = getArrayProperty(entry.region);
      buildParsedRegion(newEntry.region, regions);
    }
  }

  function buildParsedRegion(regionArray: TreeRegion[], parsedRegion: TreeXmlRegion[]) {
    if (parsedRegion === null) {
      // No regions in this group
      return;
    }
    for (const region of parsedRegion) {
      const newRegion: TreeRegion = {
        id: region._attributes.id,
        page: [],
      };
      regionArray.push(newRegion);
      const pages = getArrayProperty(region.page);
      buildParsedPage(newRegion.page, pages);
    }
  }

  function buildParsedPage(pageArray: TreePage[], parsedPage: TreeXmlPage[]) {
    if (parsedPage === null) {
      // No pages in this region
      const empty = { text: '' };
      pageArray.push(empty);
      return;
    }
    for (const page of parsedPage) {
      const newPage = { text: page._cdata };
      pageArray.push(newPage);
    }
  }
</script>

<div class="absolute top-0 left-0 flex flex-col h-full w-full">
  <MenuBar />
  <MainLayout />
  <TextPromptModal />
  <ConfirmPromptModal />
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
    color: white;
    font-size: 12px;
    line-height: 12px;
  }

  :global(p) {
    margin: 0;
  }

  :global(h1) {
    margin: 0;
  }
</style>

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
  import { Entry, TreePage, Region, TreeData, Group, Info } from '$modules/treeData';
  import type {
    TreeXmlEntry,
    TreeXmlGroup,
    TreeXmlPage,
    TreeXmlRegion,
    TreeXmlRoot,
  } from '$modules/treeXmlData';
  import { getArrayProperty } from '$modules/utils';
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
    const loadedInfo = new Info(
      data.info.version._text,
      data.info.activeregion._text,
      parsedRegions,
      data.info.name._text,
    );
    const loadedData = new TreeData(loadedInfo);
    const groups = getArrayProperty(data.group);
    buildParsedGroupsRecursive(loadedData, groups);

    treeData.set(loadedData);
    treeActiveNode.set(null);
    regionList.set(loadedData.info.regions);
    activeRegion.set(loadedData.info.activeregion);
  }

  function buildParsedGroupsRecursive(parent: TreeData | Group, parsedGroup: TreeXmlGroup[]) {
    if (parsedGroup === null) {
      // Nothing in the parent group
      return;
    }
    for (const group of parsedGroup) {
      const newGroup = new Group(group._attributes.id, parent);
      const entries = getArrayProperty(group.entry);
      buildParsedEntry(newGroup, entries);
      const groups = getArrayProperty(group.group);
      buildParsedGroupsRecursive(newGroup, groups);
    }
  }

  function buildParsedEntry(parent: Group, parsedEntry: TreeXmlEntry[]) {
    if (parsedEntry === null) {
      // No entries in this group
      return;
    }
    for (const entry of parsedEntry) {
      const newEntry = new Entry(entry._attributes.id, parent);
      const regions = getArrayProperty(entry.region);
      buildParsedRegion(newEntry.region, regions);
    }
  }

  function buildParsedRegion(regionArray: Region[], parsedRegion: TreeXmlRegion[]) {
    if (parsedRegion === null) {
      // No regions in this group
      return;
    }
    for (const region of parsedRegion) {
      const newRegion = new Region(region._attributes.id);
      regionArray.push(newRegion);
      const pages = getArrayProperty(region.page);
      buildParsedPage(newRegion.page, pages);
    }
  }

  function buildParsedPage(pageArray: TreePage[], parsedPage: TreeXmlPage[]) {
    if (!parsedPage) {
      // No pages in this region
      const empty = new TreePage('');
      pageArray.push(empty);
      return;
    }
    for (const page of parsedPage) {
      const newPage = new TreePage(page._cdata);
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

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
  import { parseXmlRoot, type XmlRoot } from '$modules/xmlData';
  import { activeRegion, regionList, treeActiveNode, treeData } from '$stores';
  import { onMount } from 'svelte';

  onMount(() => {
    electronListen(ElectronEvent.TreeChange, onTreeDataChanged);
    electronListen(ElectronEvent.GetProjectExport, onGetProjectExportRequest);
    electronListen(ElectronEvent.EventNewProject, onNewProject);
    electronListen(ElectronEvent.EventUndo, onUndo);
    electronListen(ElectronEvent.EventRedo, onRedo);
    electronDispatch(ElectronEvent.ReloadLastProject);
  });

  function onUndo() {
    console.log('undo!');
  }

  function onRedo() {
    console.log('redo!');
  }

  function onNewProject() {
    // TODO
    console.log('New project request');
  }

  function onGetProjectExportRequest(request: SaveRequest) {
    const message: SaveMessage = { request, data: $treeData };
    electronDispatch(ElectronEvent.ReceiveProjectExport, message);
  }

  function onTreeDataChanged(root: XmlRoot) {
    const parsedData = parseXmlRoot(root);

    treeData.set(parsedData);
    treeActiveNode.set(null);
    regionList.set(parsedData.info.regions);
    activeRegion.set(parsedData.info.activeregion);
  }
</script>

<div class="absolute top-0 left-0 flex flex-col h-full w-full">
  <MenuBar />
  <MainLayout />
  <TextPromptModal />
  <ConfirmPromptModal />
</div>

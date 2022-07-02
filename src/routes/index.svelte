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
  import { dataToExportXml, dataToProjectXml } from '$modules/export';
  import { TranslationData } from '$modules/translationData';
  import { parseXmlRoot, type XmlRoot } from '$modules/xml';
  import {
    activeRegion,
    regionList,
    treeHighlightNode,
    treeData,
    treeActiveEntry,
    treeContextNode,
    unsavedExport,
    unsavedProject,
  } from '$stores';
  import { onMount } from 'svelte';

  onMount(() => {
    // Set empty tree content
    treeData.set(TranslationData.emptyData());

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
    // TODO New Project
    console.log('New project request');
  }

  function onGetProjectExportRequest(request: SaveRequest) {
    const doExport = request.msg.doExport;
    const data = $treeData;
    const xml = doExport ? dataToExportXml(data) : dataToProjectXml(data);
    const message: SaveMessage = { request, xml };
    electronDispatch(ElectronEvent.ReceiveProjectExport, message);
    if (doExport) {
      unsavedExport.set(false);
    } else {
      unsavedProject.set(false);
    }
  }

  function onTreeDataChanged(root: XmlRoot) {
    const parsedData = parseXmlRoot(root);
    if (!parsedData) {
      return;
    }

    // Reset app state
    treeData.set(parsedData);
    treeHighlightNode.set(null);
    treeActiveEntry.set(null);
    treeContextNode.set(null);
    regionList.set(parsedData.info.regions);
    activeRegion.set(parsedData.info.activeregion);
    unsavedExport.set(false);
    unsavedProject.set(false);
  }
</script>

<div class="absolute top-0 left-0 flex flex-col h-full w-full">
  <MenuBar />
  <MainLayout />
  <TextPromptModal />
  <ConfirmPromptModal />
</div>

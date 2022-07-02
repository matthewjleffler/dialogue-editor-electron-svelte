<script lang="ts">
  import { rootContentId } from '$modules/constants';
  import { ElectronEvent, electronListen } from '$modules/electron';
  import { displayConfirmPrompt, displayTextPrompt } from '$modules/prompt';
  import { TreeEvent, treeEventDispatcher, TreeNodeItem } from '$modules/tree';
  import { Entry, type TranslationData, Group } from '$modules/translationData';
  import { getRegionFromEntry, splitTrailingNumerals } from '$modules/utils';
  import {
    activeRegion,
    filterId,
    filterText,
    treeActiveEntry,
    treeHighlightNode,
    treeContextNode,
    treeData,
  } from '$stores';
  import { onDestroy, onMount } from 'svelte';
  import TreeNode from './TreeNode.svelte';
  import { L } from '$modules/localization';

  interface Count {
    num: number;
  }

  const collapseCount = 40;

  let tree: TreeNodeItem;
  let validatorParent: Group;
  let copyBuffer: TreeNodeItem;

  const cleanupRefresh = treeEventDispatcher.addListener(TreeEvent.RefreshTree, onRefresh);
  $: buildTree($treeData, $filterId, $filterText);

  onMount(() => {
    electronListen(ElectronEvent.ContextTreeNewGroup, onNewGroup);
    electronListen(ElectronEvent.ContextTreeNewEntry, onNewEntry);
    electronListen(ElectronEvent.ContextTreeDuplicateId, onDupliateId);
    electronListen(ElectronEvent.ContextTreeRename, onRename);
    electronListen(ElectronEvent.ContextTreeDelete, onDelete);
    electronListen(ElectronEvent.ContextTreeCut, onCut);
    electronListen(ElectronEvent.ContextTreeCopy, onCopy);
    electronListen(ElectronEvent.ContextTreePaste, onPaste);
  });

  onDestroy(cleanupRefresh);

  function onRefresh() {
    tree = tree;
  }

  function clearContextAndSort() {
    const entry = $treeActiveEntry;
    if (entry) {
      treeActiveEntry.set(null);
      treeActiveEntry.set(entry);
    }

    const context = $treeContextNode;
    if (context.children) {
      context.children.sort(sortChildren);
    } else {
      context.parent.children.sort(sortChildren);
    }

    treeHighlightNode.set(null);
    treeContextNode.set(null);
    tree = tree;
  }

  async function onNewGroup() {
    let node = $treeContextNode;
    // Build new group and module representing that group
    if (!node.group) {
      // We clicked an entry, instead we create inside our parent group
      node = node.parent;
    }
    // Highlight group
    treeHighlightNode.set(node);

    validatorParent = node.group;
    const value = await displayTextPrompt(
      L.HeaderNewGroup,
      '',
      L.PromptGroupName,
      L.GroupName,
      groupIdValidator,
    );
    if (!value) {
      clearContextAndSort();
      return;
    }

    node.collapsed = false;
    const newGroup = new Group(value, node.group);
    TreeNodeItem.fromGroup(newGroup, node, false);
    clearContextAndSort();
  }

  async function promptDeleteGroup(
    node: TreeNodeItem,
    header: string,
    prompt: string,
  ): Promise<TreeNodeItem> {
    if (!node.group) {
      return null;
    }

    // Create copy to ready return
    const copy = TreeNodeItem.fromCopy(node, null, null);

    // Build prompt
    const group = node.group;
    const [groupCount, entryCount] = group.count();

    let promptValue = `${prompt} "${group.id}"?<br>`;
    if (groupCount === 1) {
      promptValue += `<br>Contains 1 child group`;
    } else if (groupCount > 1) {
      promptValue += `<br>Contains ${groupCount} child groups`;
    }
    if (entryCount === 1) {
      promptValue += `<br>Contains 1 entry`;
    } else if (entryCount > 1) {
      promptValue += `<br>Contains ${entryCount} entries`;
    }

    // Display prompt
    const result = await displayConfirmPrompt(header, promptValue, L.Yes, L.No);
    if (result > 0) {
      // Rejected
      clearContextAndSort();
      return null;
    }

    // Handle deletion
    group.markDeleted();
    group.parent.removeGroup(group);
    node.parent.removeChild(node);
    const activeEntry = $treeActiveEntry;
    if (activeEntry && activeEntry.deleted === true) {
      treeActiveEntry.set(null);
    }
    clearContextAndSort();

    // Return copy
    return copy;
  }

  async function promptDeleteEntry(
    node: TreeNodeItem,
    header: string,
    prompt: string,
  ): Promise<TreeNodeItem> {
    if (!node.entry) {
      return null;
    }

    // Create copy to ready return
    const copy = TreeNodeItem.fromCopy(node, null, null);

    // Display prompt
    const entry = node.entry;
    const result = await displayConfirmPrompt(header, `${prompt} "${entry.id}"?`, L.Yes, L.No);
    if (result > 0) {
      // Rejected
      clearContextAndSort();
      return;
    }

    // Handle deletion
    const activeEntry = $treeActiveEntry;
    if (activeEntry === entry) {
      treeActiveEntry.set(null);
    }
    entry.parent.removeEntry(entry);
    node.parent.removeChild(node);

    clearContextAndSort();

    // Return copy
    return copy;
  }

  async function onDelete() {
    const node = $treeContextNode;
    treeHighlightNode.set(node);

    if (!node.parent) {
      await displayConfirmPrompt(L.InvalidAction, L.InvalidDeleteRoot, L.Okay);
      clearContextAndSort();
      return;
    }

    if (node.group) {
      promptDeleteGroup(node, L.HeaderDeleteGroup, L.PromptDeleteGroup);
    } else {
      promptDeleteEntry(node, L.HeaderDeleteEntry, L.PromptDeleteEntry);
    }
  }

  async function onCut() {
    const node = $treeContextNode;
    treeHighlightNode.set(node);

    if (!node.parent) {
      await displayConfirmPrompt(L.InvalidAction, L.InvalidCutRoot, L.Okay);
      clearContextAndSort();
      return;
    }

    if (node.group) {
      const copy = await promptDeleteGroup(
        node,
        'Cut Group?',
        'Are you sure you want to cut the group',
      );
      if (copy) {
        copyBuffer = copy;
        console.log('Cut', copyBuffer);
      }
    } else {
      const copy = await promptDeleteEntry(
        node,
        'Cuy Entry?',
        'Are you sure you want to cut the entry',
      );
      if (copy) {
        copyBuffer = copy;
        console.log('Cut', copyBuffer);
      }
    }
  }

  async function onCopy() {
    const node = $treeContextNode;
    if (node.group && node.group.id === rootContentId) {
      await displayConfirmPrompt(L.InvalidAction, L.InvalidCopyRoot, L.Okay);
      return;
    }

    const copy = TreeNodeItem.fromCopy(node, null, null);
    copyBuffer = copy;
    console.log('Copied', copyBuffer);
  }

  async function onPaste() {
    if (!copyBuffer) {
      await displayConfirmPrompt(L.InvalidAction, L.InvalidNothingToPaste, L.Okay);
      return;
    }

    let node = $treeContextNode;
    if (node.entry) {
      // If we're pasting into an entry, paste into its parent group
      node = node.parent;
    }

    // Check to be sure we're not pasting an entry into the root
    if (copyBuffer.entry && node.group && node.group.id === rootContentId) {
      await displayConfirmPrompt(L.InvalidAction, L.InvalidEntryInRoot, L.Okay);
      return;
    }

    const validName = getNonDuplicateName(copyBuffer, node.group);
    if (copyBuffer.entry) {
      // Pasting entry
      copyEntry(copyBuffer.entry, validName, node.group, node);
    } else {
      // Pasting group
      copyGroup(copyBuffer.group, validName, node.group, node);
    }
  }

  async function onNewEntry() {
    let node = $treeContextNode;
    if (!node.group) {
      // We clicked an entry, instead we create inside our parent group
      node = node.parent;
    }

    // Highlight group
    treeHighlightNode.set(node);

    if (node.parent === null) {
      await displayConfirmPrompt(L.InvalidAction, L.InvalidEntryInRoot, L.Okay);
      clearContextAndSort();
      return;
    }

    validatorParent = node.group;
    const value = await displayTextPrompt(
      L.HeaderNewEntry,
      '',
      L.PromptEntryName,
      L.EntryName,
      entryIdValidator,
    );
    if (!value) {
      clearContextAndSort();
      return;
    }

    node.collapsed = false;
    const newEntry = Entry.newEmptyEntry(value, node.group);
    TreeNodeItem.fromEntry(newEntry, node, false);
    treeActiveEntry.set(newEntry);
    clearContextAndSort();
  }

  async function onDupliateId() {
    const node = $treeContextNode;
    if (node.group && node.group.id === rootContentId) {
      await displayConfirmPrompt(L.InvalidAction, L.InvalidCopyRoot, L.Okay);
      return;
    }

    const validatorGroup = node.entry ? node.entry.parent : node.group.parent;
    const newId = getNonDuplicateName(node, validatorGroup);

    if (node.entry) {
      copyEntry(node.entry, newId, node.entry.parent, node.parent);
    } else {
      copyGroup(node.group, newId, node.group.parent, node.parent);
    }
  }

  function copyEntry(original: Entry, newId: string, group: Group, nodeParent: TreeNodeItem) {
    nodeParent.collapsed = false;
    // Create copy and set new id
    const copy = Entry.copyTo(original, group);
    copy.setId(newId);
    // Create node
    TreeNodeItem.fromEntry(copy, nodeParent, false);
    treeActiveEntry.set(copy);
    treeContextNode.set(nodeParent);
    clearContextAndSort();
  }

  function copyGroup(original: Group, newId: string, groupParent: Group, nodeParent: TreeNodeItem) {
    nodeParent.collapsed = false;
    // Create copy and set new id
    const copy = Group.copyTo(original, groupParent);
    copy.setId(newId);
    // Populate tree
    buildTreeRecursive(copy, nodeParent, false);
    treeContextNode.set(nodeParent);
    clearContextAndSort();
  }

  function getNonDuplicateName(node: TreeNodeItem, validatorGroup: Group): string {
    const original = node.module;

    // Split apart any numerals
    let [id, value] = splitTrailingNumerals(original);

    // Set up validators
    let validator: (value: string) => boolean;
    validatorParent = validatorGroup;
    if (node.entry) {
      // Checking entries
      validator = entryIdValidator;
    } else {
      // Checking groups
      validator = groupIdValidator;
    }

    // If we don't already have a numeral, we are allowed to keep the original name if it doesn't
    // conflict
    if (value < 1 && validator(id)) {
      return id;
    }

    // Step through numbers until we find a valid one
    let newId: string;
    do {
      value++;
      newId = `${id}${value}`;
    } while (!validator(newId));

    return newId;
  }

  async function onRename() {
    const node = $treeContextNode;
    treeHighlightNode.set(node);

    if (node.group) {
      if (node.parent == null) {
        await displayConfirmPrompt(L.InvalidAction, L.InvalidRenameRoot, L.Okay);
        clearContextAndSort();
        return;
      }
      validatorParent = node.group.parent;
      const value = await displayTextPrompt(
        L.HeaderRenameGroup,
        node.group.id,
        L.PromptGroupName,
        L.GroupName,
        groupIdValidator,
      );
      if (!value) {
        clearContextAndSort();
        return;
      }
      node.group.setId(value);

      clearContextAndSort();
    } else {
      validatorParent = node.entry.parent;
      const value = await displayTextPrompt(
        L.HeaderRenameEntry,
        node.entry.id,
        L.PromptEntryName,
        L.EntryName,
        entryIdValidator,
      );
      if (!value) {
        clearContextAndSort();
        return;
      }
      node.entry.setId(value);
      treeActiveEntry.set(node.entry);

      clearContextAndSort();
    }
  }

  function buildTree(data: TranslationData, filterId: string, filterText: string) {
    if (!data) {
      tree = null;
      return;
    }
    const rootGroup = data.group[0];
    const count: Count = { num: 0 };
    const filteringId = filterId !== '';
    const filteringText = filterText !== '';
    markFiltersRecursive(filteringId, filteringText, rootGroup, false, count);
    const rootTree = buildTreeRecursive(rootGroup, null, count.num > collapseCount);
    rootTree.collapsed = false;
    sortTreeRecursive(rootTree);
    tree = rootTree;
  }

  function markFiltersRecursive(
    filterId: boolean,
    filterText: boolean,
    group: Group,
    parentFiltered: boolean,
    count: Count,
  ) {
    // Mark filter state of ids
    const groupMeetsId = groupMeetsFilterIdCriteria(group);
    if (filterId && filterText) {
      // Show only entries with matching text that have matching ids somewhere in their history
      group.meetsFilter = false;
      const renderChildren = parentFiltered || groupMeetsId;
      // Handle entries
      for (const entry of group.entry) {
        const entryMeetsId = entryMeetsFilterIdCriteria(entry);
        const entryMeetsText = entryMeetsFilterTextCriteria(entry);
        if ((renderChildren || entryMeetsId) && entryMeetsText) {
          count.num++;
          entry.meetsFilter = true;
          group.meetsFilter = true;
        } else {
          entry.meetsFilter = false;
        }
      }
      // Look at child groups
      for (const child of group.group) {
        if (markFiltersRecursive(filterId, filterText, child, renderChildren, count)) {
          group.meetsFilter = true;
        }
      }
    } else if (filterId) {
      // Show any matching ids, and show all children of matching groups
      group.meetsFilter = parentFiltered || groupMeetsId;
      // If we were filtered, render all children
      const renderChildren = group.meetsFilter;
      // Handle entries
      for (const entry of group.entry) {
        const entryMeetsId = entryMeetsFilterIdCriteria(entry);
        if (renderChildren || entryMeetsId) {
          count.num++;
          entry.meetsFilter = true;
          group.meetsFilter = true;
        } else {
          entry.meetsFilter = false;
        }
      }
      // Handle child groups
      for (const child of group.group) {
        if (markFiltersRecursive(filterId, filterText, child, renderChildren, count)) {
          group.meetsFilter = true;
        }
      }
    } else if (filterText) {
      // Show only entries with matching text
      group.meetsFilter = false;
      for (const entry of group.entry) {
        const entryMeetsText = entryMeetsFilterTextCriteria(entry);
        if (entryMeetsText) {
          count.num++;
          entry.meetsFilter = true;
          group.meetsFilter = true;
        } else {
          entry.meetsFilter = false;
        }
      }
      // Handle child groups
      for (const child of group.group) {
        if (markFiltersRecursive(filterId, filterText, child, false, count)) {
          group.meetsFilter = true;
        }
      }
    } else {
      // Show everything
      group.meetsFilter = true;
      for (const entry of group.entry) {
        count.num++;
        entry.meetsFilter = true;
      }
      for (const child of group.group) {
        markFiltersRecursive(filterId, filterText, child, false, count);
      }
    }

    // Always show content, but it doesn't count for filtering
    if (group.id === rootContentId) {
      group.meetsFilter = true;
    }

    if (group.meetsFilter) {
      count.num++;
    }
    return group.meetsFilter;
  }

  function groupMeetsFilterIdCriteria(group: Group): boolean {
    // We contain filter, render
    if (group.path && group.path.toLowerCase().includes($filterId)) {
      return true;
    }
    // We don't contain filter
    return false;
  }

  function entryMeetsFilterIdCriteria(entry: Entry): boolean {
    // We contain filter, render
    if (entry.path && entry.path.toLowerCase().includes($filterId)) {
      return true;
    }
    // We don't contain filter
    return false;
  }

  function entryMeetsFilterTextCriteria(entry: Entry): boolean {
    // We contain filter text, render
    const region = getRegionFromEntry(entry, $activeRegion);
    if (region !== undefined) {
      const regionPages = region.page;
      if (regionPages !== undefined) {
        for (const page of regionPages) {
          if (page.text.toLowerCase().includes($filterText)) {
            return true;
          }
        }
      }
    }
    // We don't contain filter
    return false;
  }

  function buildTreeRecursive(
    group: Group,
    parent: TreeNodeItem,
    collapsed: boolean,
  ): TreeNodeItem {
    if (!group.meetsFilter) {
      return null;
    }
    const newBranch = TreeNodeItem.fromGroup(group, parent, collapsed);
    for (const child of group.group) {
      buildTreeRecursive(child, newBranch, collapsed);
    }
    for (const entry of group.entry) {
      if (!entry.meetsFilter) {
        continue;
      }
      TreeNodeItem.fromEntry(entry, newBranch, collapsed);
    }
    return newBranch;
  }

  function sortTreeRecursive(node: TreeNodeItem) {
    if (!node.children || node.children.length < 1) {
      return;
    }
    for (const child of node.children) {
      sortTreeRecursive(child);
    }
    node.children.sort(sortChildren);
  }

  function sortChildren(left: TreeNodeItem, right: TreeNodeItem): number {
    if ((left.group && right.group) || (left.entry && right.entry)) {
      // Both same type, alphabetize
      return left.module.localeCompare(right.module);
    }
    if (left.group && right.entry) {
      // Entry comes after group
      return -1;
    }
    // Otherwise, entries come after groups
    if (left.entry && right.group) {
      return 1;
    }
  }

  function groupIdValidator(value: string): boolean {
    if (!value || value.length < 1) {
      return false;
    }
    for (const group of validatorParent.group) {
      if (group.id === value) {
        return false;
      }
    }
    return true;
  }

  function entryIdValidator(value: string): boolean {
    if (!value || value.length < 1) {
      return false;
    }
    for (const entry of validatorParent.entry) {
      if (entry.id === value) {
        return false;
      }
    }
    return true;
  }
</script>

<div class="w-full h-full overflow-auto flex flex-col p-1 gap-1 mt-2">
  {#if tree}
    <TreeNode item={tree} />
  {/if}
</div>

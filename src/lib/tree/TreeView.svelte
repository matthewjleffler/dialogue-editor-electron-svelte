<script lang="ts">
  import { rootContentId } from '$modules/constants';
  import { ElectronEvent, electronListen } from '$modules/electron';
  import { displayConfirmPrompt, displayTextPrompt } from '$modules/prompt';
  import { TreeEvent, treeEventDispatcher, TreeNodeItem } from '$modules/tree';
  import { Entry, type TranslationData, Group } from '$modules/translationData';
  import { arrayRemove, getRegionFromEntry, splitTrailingNumerals } from '$modules/utils';
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

  interface Count {
    num: number;
  }

  const collapseCount = 40;

  let tree: TreeNodeItem;
  let validatorParent: Group;

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

  function iterateGroups(
    parent: Group,
    groupAction: (group: Group) => void,
    entryAction: (entry: Entry) => void,
  ) {
    for (const group of parent.group) {
      groupAction(group);
      iterateGroups(group, groupAction, entryAction);
    }
    for (const entry of parent.entry) {
      entryAction(entry);
    }
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
      'New Group',
      '',
      'Enter group name',
      'Group name',
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

  async function onDelete() {
    const node = $treeContextNode;
    const activeEntry = $treeActiveEntry;

    // Highlight
    treeHighlightNode.set(node);

    if (node.group) {
      if (node.parent === null) {
        await displayConfirmPrompt('Invalid Action', 'Cannot delete root group.', 'Okay');
        clearContextAndSort();
        return;
      }
      const group = node.group;
      let groupCount = 0;
      let entryCount = 0;
      iterateGroups(
        group,
        () => {
          groupCount++;
        },
        () => {
          entryCount++;
        },
      );

      let prompt = `Are you sure you want to delete the group "${group.id}"?<br>`;
      if (groupCount === 1) {
        prompt += `<br>Contains 1 child group`;
      } else if (groupCount > 1) {
        prompt += `<br>Contains ${groupCount} child groups`;
      }
      if (entryCount === 1) {
        prompt += `<br>Contains 1 entry`;
      } else if (entryCount > 1) {
        prompt += `<br>Contains ${entryCount} entries`;
      }

      const result = await displayConfirmPrompt('Delete Group?', prompt, 'Yes', 'No');
      if (result === 1) {
        // No
        clearContextAndSort();
        return;
      }

      // Mark children as deleted
      iterateGroups(
        group,
        (childGroup) => {
          childGroup.deleted = true;
        },
        (childEntry) => {
          childEntry.deleted = true;
        },
      );

      arrayRemove(group.parent.group, group);
      arrayRemove(node.parent.children, node);
      if (activeEntry && activeEntry.deleted === true) {
        treeActiveEntry.set(null);
      }

      clearContextAndSort();
    } else {
      const entry = node.entry;
      const result = await displayConfirmPrompt(
        'Delete Entry?',
        `Are you sure you want to delete the entry "${entry.id}"?`,
        'Yes',
        'No',
      );
      if (result === 1) {
        clearContextAndSort();
        return;
      }
      if (activeEntry === entry) {
        treeActiveEntry.set(null);
      }
      arrayRemove(entry.parent.entry, entry);
      arrayRemove(node.parent.children, node);

      clearContextAndSort();
    }
  }

  async function onCut() {
    // TODO
  }

  async function onCopy() {
    // TODO
  }

  async function onPaste() {
    // TODO
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
      await displayConfirmPrompt('Invalid Action', 'Cannot add entries to root group.', 'Okay');
      clearContextAndSort();
      return;
    }

    validatorParent = node.group;
    const value = await displayTextPrompt(
      'New Entry',
      '',
      'Enter Entry Name:',
      'Entry Name',
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

  function onDupliateId() {
    const node = $treeContextNode;
    const original = node.module;

    // Split apart any numerals
    let [id, value] = splitTrailingNumerals(original);

    // Set up validators
    let validator: (value: string) => boolean;
    if (node.entry) {
      // Checking entries
      validatorParent = node.entry.parent;
      validator = entryIdValidator;
    } else {
      // Checking groups
      validatorParent = node.group.parent;
      validator = groupIdValidator;
    }

    // Step through numbers until we find a valid one
    let newId: string;
    do {
      value++;
      newId = `${id}${value}`;
    } while (!validator(newId));

    console.log('Final id', newId);
    if (node.entry) {
      // Create copy and set new id
      const copy = Entry.copyTo(node.entry, node.entry.parent);
      copy.setId(newId);
      // Create node
      TreeNodeItem.fromEntry(copy, node.parent, false);
    } else {
      // Create copy and set new id
      const copy = Group.copyTo(node.group, node.group.parent);
      copy.setId(newId);
      // Populate tree
      buildTreeRecursive(copy, node.parent, false);
    }

    clearContextAndSort();
  }

  async function onRename() {
    const node = $treeContextNode;
    treeHighlightNode.set(node);

    if (node.group) {
      if (node.parent == null) {
        await displayConfirmPrompt('Invalid Action', 'Cannot rename root group.', 'Okay');
        clearContextAndSort();
        return;
      }
      validatorParent = node.group.parent;
      const value = await displayTextPrompt(
        'Rename Group',
        node.group.id,
        'Enter group name:',
        'Group name',
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
        'Rename Entry',
        node.entry.id,
        'Enter entry name:',
        'Entry name',
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

  function buildTree(constructedTree: TranslationData, filterId: string, filterText: string) {
    const rootGroup = constructedTree.group[0];
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
  <TreeNode item={tree} />
</div>

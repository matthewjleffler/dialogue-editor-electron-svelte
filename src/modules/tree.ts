import { EventDispatcher } from "./eventDispatcher";
import type { TreeEntry, TreeGroup } from "./treeData";

export class TreeNodeItem {
  module: string;
  parent: TreeNodeItem;
  collapsed: boolean;
  group: TreeGroup;
  children: TreeNodeItem[];
  entry: TreeEntry;

  private constructor(module: string, parent: TreeNodeItem, collapsed: boolean) {
    this.module = module;
    this.collapsed = collapsed;
    this.parent = parent;
    if (parent) {
      parent.children.push(this);
    }
  }

  static fromTreeGroup(group: TreeGroup, parent: TreeNodeItem, collapsed: boolean): TreeNodeItem {
    const newItem = new TreeNodeItem(group.id, parent, collapsed);
    newItem.group = group;
    newItem.children = [];
    return newItem;
  }

  static fromTreeEntry(entry: TreeEntry, parent: TreeNodeItem, collapsed: boolean): TreeNodeItem {
    const newItem = new TreeNodeItem(entry.id, parent, collapsed);
    newItem.entry = entry;
    return newItem;
  }
};

export enum TreeEvent {
  RefreshEntry,
  RefreshTree,
}

export const treeEventDispatcher = new EventDispatcher<TreeEvent>();

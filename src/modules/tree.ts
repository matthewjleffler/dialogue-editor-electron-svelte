import { EventDispatcher } from "./eventDispatcher";
import type { Entry, Group } from "./translationData";

export class TreeNodeItem {
  parent: TreeNodeItem;
  collapsed: boolean;
  group: Group;
  children: TreeNodeItem[];
  entry: Entry;

  private constructor(parent: TreeNodeItem, collapsed: boolean) {
    this.collapsed = collapsed;
    this.parent = parent;
    if (parent) {
      parent.children.push(this);
    }
  }

  static fromGroup(group: Group, parent: TreeNodeItem, collapsed: boolean): TreeNodeItem {
    const newItem = new TreeNodeItem(parent, collapsed);
    newItem.group = group;
    newItem.children = [];
    return newItem;
  }

  static fromEntry(entry: Entry, parent: TreeNodeItem, collapsed: boolean): TreeNodeItem {
    const newItem = new TreeNodeItem(parent, collapsed);
    newItem.entry = entry;
    return newItem;
  }

  get module(): string {
    if (this.group) {
      return this.group.id;
    }
    if (this.entry) {
      return this.entry.id;
    }
    return 'invalid-node';
  }
};

export enum TreeEvent {
  RefreshEntry,
  RefreshTree,
}

export const treeEventDispatcher = new EventDispatcher<TreeEvent>();

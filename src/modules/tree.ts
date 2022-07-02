import { EventDispatcher } from "./eventDispatcher";
import { Entry, Group } from "./translationData";

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

  static fromCopy(original: TreeNodeItem, parentGroup: Group, parentNode: TreeNodeItem): TreeNodeItem {
    // Copy contents first
    if (original.entry) {
      // Entry
      const copyEntry = Entry.copyTo(original.entry, parentGroup)
      const copy = TreeNodeItem.fromEntry(copyEntry, parentNode, false);
      return copy;
    } else {
      // Group
      const copyGroup = Group.copyTo(original.group, parentGroup);
      const copy = TreeNodeItem.fromGroup(copyGroup, parentNode, false);
      return copy;
    }
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

  removeChild(node: TreeNodeItem) {
    if (!this.children) {
      return;
    }
    const index = this.children.indexOf(node);
    if (index < 0) {
      return;
    }
    this.children.splice(index, 1);
  }
};

export enum TreeEvent {
  RefreshEntry,
  RefreshTree,
}

export const treeEventDispatcher = new EventDispatcher<TreeEvent>();

import { EventDispatcher } from "./eventDispatcher";
import type { TreeEntry, TreeGroup } from "./treeData";

export interface TreeNodeItem {
  module: string,
  parent: TreeNodeItem,
  children?: TreeNodeItem[],
  group?: TreeGroup,
  collapsed?: boolean,
  leaf?: boolean,
  entry?: TreeEntry,
  region?: string[],
};

export enum TreeEvent {
  RefreshEntry,
  RefreshTree,
}

export const treeEventDispatcher = new EventDispatcher<TreeEvent>();

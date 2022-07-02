interface Localization {
  InvalidAction: string,

  InvalidDeleteRoot: string,
  InvalidCutRoot: string,
  InvalidCopyRoot: string,
  InvalidNothingToPaste: string,
  InvalidEntryInRoot: string,
  InvalidRenameRoot: string,
  InvalidDeleteLastPage: string,

  HeaderDeleteGroup: string,
  HeaderCutGroup: string,
  HeaderDeleteEntry: string,
  HeaderCutEntry: string,
  PromptDeleteGroup: string,
  PromptCutGroup: string,
  PromptDeleteEntry: string,
  PromptCutEntry: string,

  HeaderDeletePage: string,
  PromptDeletePage: string,

  HeaderNewEntry: string,
  HeaderNewGroup: string,
  HeaderNewRegion: string,
  HeaderRenameEntry: string,
  HeaderRenameGroup: string,
  PromptEntryName: string,
  PromptGroupName: string,
  PromptRegionName: string,
  EntryName: string,
  GroupName: string,
  RegionName: string,

  Yes: string,
  No: string,
  Okay: string,
}

const en: Localization = {
  InvalidAction: 'Invalid Action',

  InvalidDeleteRoot: 'Cannot delete root group',
  InvalidCutRoot: 'Cannot cut root group',
  InvalidCopyRoot: 'Cannot copy root group',
  InvalidNothingToPaste: 'Nothing to paste',
  InvalidEntryInRoot: 'Cannot add entry to root group',
  InvalidRenameRoot: 'Cannot rename root group',
  InvalidDeleteLastPage: 'Cannot delete last page in an entry',

  HeaderDeleteGroup: 'Delete Group?',
  HeaderCutGroup: 'Cut Group?',
  HeaderDeleteEntry: 'Delete Entry?',
  HeaderCutEntry: 'Cut Entry?',
  PromptDeleteGroup: 'Are you sure you want to delete the group',
  PromptCutGroup: 'Are you sure you want to cut the group',
  PromptDeleteEntry: 'Are you sure you want to delete the entry',
  PromptCutEntry: 'Are you sure you want to cut the entry',

  HeaderDeletePage: 'Delete Page?',
  PromptDeletePage: 'Are you sure you want to delete page',

  HeaderNewEntry: 'New Entry',
  HeaderNewGroup: 'New Group',
  HeaderNewRegion: 'New Region Id',
  HeaderRenameEntry: 'Rename Entry',
  HeaderRenameGroup: 'Rename Group',
  PromptEntryName: 'Enter Entry Name:',
  PromptGroupName: 'Enter Group Name:',
  PromptRegionName: 'Enter Region Id:',
  EntryName: 'Entry Name',
  GroupName: 'Group Name',
  RegionName: 'Region Id',

  Yes: 'Yes',
  No: 'No',
  Okay: 'Okay',
};

export const L = en;

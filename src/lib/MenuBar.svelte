<script lang="ts">
  import { leftPaneWidth } from '$modules/constants';
  import { displayTextPrompt } from '$modules/prompt';
  import { TreeEvent, treeEventDispatcher } from '$modules/tree';
  import { Region, type Group } from '$modules/treeData';
  import { activeRegion, regionList, treeActiveEntry, treeData } from '$stores';

  interface Option {
    value: string;
    name: string;
    disabled: boolean;
  }

  const newId = 'new';

  let options: Option[];
  let selectedValue: string;

  $: entry = $treeActiveEntry?.path;
  $: selectedValue = $activeRegion;
  $: createOptions($regionList);
  $: onChangeValue(selectedValue);

  function createOptions(regions: string[]) {
    if (!regions) {
      options = [];
      return;
    }
    options = [];
    for (const region of regions) {
      const option: Option = {
        value: region,
        name: region,
        disabled: false,
      };
      options.push(option);
    }
    options.push({ value: 'sep', name: '____________', disabled: true });
    options.push({ value: newId, name: 'New', disabled: false });
  }

  async function onChangeValue(value: string) {
    if (!value) {
      return;
    }

    const data = $treeData;

    if (value !== newId) {
      // Simply set the new value
      activeRegion.set(value);
      data.info.activeregion = value;
      treeEventDispatcher.dispatch(TreeEvent.RefreshTree);
      return;
    }

    if (value !== newId) {
      // What happened here?
      return;
    }

    // Temporarily set the value back to the original for now -
    selectedValue = $activeRegion;

    const newRegion = await displayTextPrompt(
      'New Region Id',
      '',
      'Enter new Region Id:',
      'Region Id',
    );
    if (!newRegion) {
      // No change
      return;
    }

    // Got a new region, assign it, change to it
    const regions = $regionList;
    regions.push(newRegion);
    regions.sort(); // Sort alphabetically
    regionList.set(regions);
    activeRegion.set(newRegion);

    // Loop over whole tree and add region with empty page to every entry
    data.info.activeregion = newRegion;
    populateGroupRecursive(data.group[0], newRegion);
    treeData.set(data);
  }

  function populateGroupRecursive(group: Group, regionId: string) {
    for (const entry of group.entry) {
      const region = Region.newEmptyRegion(regionId);
      entry.region.push(region);
    }

    for (const child of group.group) {
      populateGroupRecursive(child, regionId);
    }
  }
</script>

<div class="w-full flex bg-menu-grey">
  <div class="w-[var(--width)] p-1" style="--width: {leftPaneWidth}px;">
    <label>
      Region:
      <select bind:value={selectedValue}>
        {#each options as { value, name, disabled }}
          <option {value} {disabled}>{name}</option>
        {/each}
      </select>
    </label>
  </div>
  <div class="flex-1 p-1 flex items-center">
    <p>{entry ? `Entry: ${entry}` : `No Entry Selected`}</p>
  </div>
</div>

<style lang="postcss">
  select {
    @apply text-black w-32;
  }
</style>

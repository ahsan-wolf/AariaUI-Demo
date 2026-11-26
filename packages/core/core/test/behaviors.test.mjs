import test from "node:test";
import assert from "node:assert/strict";
import {
  AutoCompleteBehavior,
  ConfirmButtonBehavior,
  CollapsiblePanelBehavior,
  CascadingDropDownBehavior,
  ModalBehavior,
  TabsController,
  AccordionController,
} from "../dist/behaviors/index.js";

test("AutoCompleteBehavior handles prefix length, caching, and search events", async () => {
  let searchCount = 0;
  const behavior = new AutoCompleteBehavior({
    minimumPrefixLength: 3,
    enableCaching: true,
    onSearch: async (term) => {
      searchCount++;
      return [`${term} 1`, `${term} 2`];
    }
  });

  let triggeredTerm = "";
  let loadedResults = [];
  behavior.searchTriggered.subscribe((s, e) => { triggeredTerm = e.term; });
  behavior.resultsLoaded.subscribe((s, e) => { loadedResults = e.results; });

  // 1. Shorter than minimum prefix length
  const shortResults = await behavior.search("ab");
  assert.equal(shortResults.length, 0);
  assert.equal(searchCount, 0);

  // 2. Valid search
  const results1 = await behavior.search("abc");
  assert.equal(results1.length, 2);
  assert.equal(triggeredTerm, "abc");
  assert.equal(loadedResults.length, 2);
  assert.equal(searchCount, 1);

  // 3. Cached search (onSearch should not be called again)
  const results2 = await behavior.search("abc");
  assert.deepEqual(results2, results1);
  assert.equal(searchCount, 1);
});

test("ConfirmButtonBehavior executes confirmation", async () => {
  let confirmed = false;
  const behavior = new ConfirmButtonBehavior({
    confirmText: "Are you sure?",
    onConfirm: () => { confirmed = true; }
  });

  // In Node environment without window.confirm, defaults safely to true
  const result = await behavior.execute();
  assert.equal(result, true);
});

test("CollapsiblePanelBehavior manages collapse state and emits events", async () => {
  const panel = new CollapsiblePanelBehavior({ collapsed: true });
  assert.equal(panel.isCollapsed, true);

  let stateChangeCount = 0;
  panel.stateChanged.subscribe((s, e) => {
    stateChangeCount++;
    assert.equal(e.collapsed, false);
  });

  panel.toggle();
  assert.equal(panel.isCollapsed, false);
  assert.equal(stateChangeCount, 1);

  // setCollapsed to same value should not emit
  panel.setCollapsed(false);
  assert.equal(stateChangeCount, 1);
});

test("CascadingDropDownBehavior loads child items on parent value change", async () => {
  const cdd = new CascadingDropDownBehavior({
    category: "Cities",
    loadItems: async (parentValue) => {
      if (parentValue === "US") return [{ text: "New York", value: "NY" }, { text: "Chicago", value: "IL" }];
      if (parentValue === "CA") return [{ text: "Toronto", value: "TO" }];
      return [];
    }
  });

  let loadedItems = [];
  cdd.itemsLoaded.subscribe((s, e) => { loadedItems = e.items; });

  const usCities = await cdd.onParentChange("US");
  assert.equal(usCities.length, 2);
  assert.equal(loadedItems.length, 2);
  assert.equal(loadedItems[0].value, "NY");

  const caCities = await cdd.onParentChange("CA");
  assert.equal(caCities.length, 1);
  assert.equal(loadedItems[0].value, "TO");
});

test("ModalBehavior controls visibility and handles ok/cancel lifecycle", async () => {
  let okCalled = false;
  let cancelCalled = false;
  const modal = new ModalBehavior({
    onOk: () => { okCalled = true; },
    onCancel: () => { cancelCalled = true; }
  });

  assert.equal(modal.isOpen, false);

  let shownFired = false;
  let hiddenFired = false;
  let okFired = false;
  let cancelFired = false;

  modal.shown.subscribe(() => { shownFired = true; });
  modal.hidden.subscribe(() => { hiddenFired = true; });
  modal.ok.subscribe(() => { okFired = true; });
  modal.cancel.subscribe(() => { cancelFired = true; });

  // 1. Show modal
  await modal.show();
  assert.equal(modal.isOpen, true);
  assert.equal(shownFired, true);

  // 2. Handle OK
  await modal.handleOk();
  assert.equal(modal.isOpen, false);
  assert.equal(okCalled, true);
  assert.equal(okFired, true);
  assert.equal(hiddenFired, true);

  // 3. Show again and Cancel
  await modal.show();
  assert.equal(modal.isOpen, true);
  await modal.handleCancel();
  assert.equal(modal.isOpen, false);
  assert.equal(cancelCalled, true);
  assert.equal(cancelFired, true);
});

test("TabsController switches tabs and manages tab collections", async () => {
  const tabs = new TabsController({
    tabs: [
      { id: "tab1", headerText: "General" },
      { id: "tab2", headerText: "Settings" }
    ]
  });

  assert.equal(tabs.activeTabIndex, 0);
  assert.equal(tabs.tabs.length, 2);

  let newActiveIndex = -1;
  tabs.activeTabChanged.subscribe((s, e) => {
    newActiveIndex = e.activeIndex;
  });

  await tabs.setActiveTab(1);
  assert.equal(tabs.activeTabIndex, 1);
  assert.equal(newActiveIndex, 1);

  // Invalid index should not switch
  await tabs.setActiveTab(99);
  assert.equal(tabs.activeTabIndex, 1);

  // setTabs clamps index if needed
  tabs.setTabs([{ id: "onlyOne", headerText: "Single" }]);
  assert.equal(tabs.tabs.length, 1);
  assert.equal(tabs.activeTabIndex, 0);
});

test("AccordionController manages pane selection and toggles", async () => {
  const accordion = new AccordionController({
    panes: [
      { id: "pane1", headerText: "Section 1" },
      { id: "pane2", headerText: "Section 2" }
    ]
  });

  assert.equal(accordion.selectedIndex, 0);
  assert.equal(accordion.panes.length, 2);

  let changedIndex = -2;
  accordion.selectionChanged.subscribe((s, e) => {
    changedIndex = e.selectedIndex;
  });

  await accordion.setSelectedIndex(1);
  assert.equal(accordion.selectedIndex, 1);
  assert.equal(changedIndex, 1);

  // Toggle active pane collapses it (-1)
  await accordion.togglePane(1);
  assert.equal(accordion.selectedIndex, -1);
  assert.equal(changedIndex, -1);

  // Toggle collapsed pane opens it
  await accordion.togglePane(0);
  assert.equal(accordion.selectedIndex, 0);
  assert.equal(changedIndex, 0);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  MenuController,
  MenuItem,
  TreeViewController,
  TreeNode,
  SiteMapPathController,
  SiteMapDataSource
} from "../dist/index.js";

const sampleSiteMap = {
  key: "home",
  url: "/home",
  title: "Home",
  description: "Portal Home Page",
  childNodes: [
    {
      key: "products",
      url: "/products",
      title: "Products",
      description: "Company Products",
      childNodes: [
        {
          key: "software",
          url: "/products/software",
          title: "Software",
          description: "Software Solutions",
          childNodes: [
            {
              key: "ide",
              url: "/products/software/ide",
              title: "Cloud IDE",
              description: "Web-based Developer IDE"
            }
          ]
        },
        {
          key: "hardware",
          url: "/products/hardware",
          title: "Hardware",
          description: "Hardware Devices"
        }
      ]
    },
    {
      key: "about",
      url: "/about",
      title: "About Us",
      description: "About the Company"
    }
  ]
};

// -------------------------------------------------------------
// 1. MenuController Tests
// -------------------------------------------------------------

test("MenuController static and dynamic item partitioning", () => {
  const menu = new MenuController({
    id: "mainMenu",
    orientation: "Horizontal",
    staticDisplayLevels: 1,
    maximumDynamicDisplayLevels: 2,
    items: [
      {
        text: "Home",
        value: "home"
      },
      {
        text: "Products",
        value: "products",
        childItems: [
          {
            text: "Software",
            value: "software",
            childItems: [
              { text: "IDE", value: "ide" }
            ]
          },
          { text: "Hardware", value: "hardware" }
        ]
      }
    ]
  });

  const staticItems = menu.getStaticItems();
  assert.equal(staticItems.length, 2);
  assert.equal(staticItems[0].text, "Home");
  assert.equal(staticItems[1].text, "Products");

  const productsItem = menu.findItem("products");
  assert.notEqual(productsItem, undefined);

  const dynamicItems = menu.getDynamicItems(productsItem);
  assert.equal(dynamicItems.length, 2);
  assert.equal(dynamicItems[0].text, "Software");
  assert.equal(dynamicItems[1].text, "Hardware");
});

test("MenuController binds to SiteMapDataSource", async () => {
  const siteMapDs = new SiteMapDataSource({
    id: "siteMapDs",
    siteMap: sampleSiteMap,
    showStartingNode: true
  });

  const menu = new MenuController({
    id: "siteMenu",
    dataSource: siteMapDs,
    staticDisplayLevels: 2
  });

  let boundCount = 0;
  menu.menuItemDataBound.subscribe(() => {
    boundCount++;
  });

  await menu.dataBind();

  assert.equal(menu.items.length, 1);
  assert.equal(menu.items[0].text, "Home");
  assert.equal(menu.items[0].childItems.length, 2);
  assert.equal(boundCount, 6); // Home + Products + Software + Cloud IDE + Hardware + About Us

  const ideItem = menu.findItem("ide");
  assert.notEqual(ideItem, undefined);
  assert.equal(ideItem.text, "Cloud IDE");
  assert.equal(ideItem.navigateUrl, "/products/software/ide");
  assert.equal(ideItem.depth, 3);
});

test("MenuController item click and selection lifecycle", async () => {
  const menu = new MenuController({
    id: "navMenu",
    items: [
      { text: "Dashboard", value: "dash" },
      { text: "Reports", value: "reports" }
    ]
  });

  let lastClickedItem = null;
  menu.menuItemClick.subscribe((_s, e) => {
    lastClickedItem = e.item;
  });

  const clicked = await menu.clickItem("dash");
  assert.equal(clicked, true);
  assert.notEqual(lastClickedItem, null);
  assert.equal(lastClickedItem?.value, "dash");
  assert.notEqual(menu.selectedItem, undefined);
  assert.equal(menu.selectedItem.value, "dash");
  assert.equal(menu.selectedItem.selected, true);

  // Cancellable click
  menu.menuItemClick.subscribe((_s, e) => {
    if (e.item.value === "reports") {
      e.cancel = true;
    }
  });

  const reportClicked = await menu.clickItem("reports");
  assert.equal(reportClicked, false);
  // Dash remains selected
  assert.equal(menu.selectedItem.value, "dash");
});

// -------------------------------------------------------------
// 2. TreeViewController Tests
// -------------------------------------------------------------

test("TreeViewController binds to SiteMapDataSource and expands to depth", async () => {
  const siteMapDs = new SiteMapDataSource({
    id: "treeDs",
    siteMap: sampleSiteMap,
    showStartingNode: true
  });

  const tree = new TreeViewController({
    id: "tree1",
    dataSource: siteMapDs,
    expandDepth: 1
  });

  await tree.dataBind();

  assert.equal(tree.nodes.length, 1);
  const root = tree.nodes[0];
  assert.equal(root.text, "Home");
  assert.equal(root.expanded, true); // depth 0 < expandDepth 1 -> expanded
  assert.equal(root.childNodes[0].expanded, false); // depth 1 not < expandDepth 1 -> collapsed

  // Expand all
  await tree.expandAll();
  assert.equal(root.childNodes[0].expanded, true);

  // Collapse all
  await tree.collapseAll();
  assert.equal(root.expanded, false);
  assert.equal(root.childNodes[0].expanded, false);
});

test("TreeViewController node selection and toggle events", async () => {
  const tree = new TreeViewController({
    id: "treeNav",
    nodes: [
      {
        text: "Documents",
        value: "docs",
        childNodes: [
          { text: "Resume.pdf", value: "resume" },
          { text: "Bio.docx", value: "bio" }
        ]
      }
    ]
  });

  let selectedNodeText = "";
  tree.selectedNodeChanged.subscribe((_s, e) => {
    selectedNodeText = e.node.text;
  });

  let expandedFired = false;
  let collapsedFired = false;
  tree.treeNodeExpanded.subscribe(() => { expandedFired = true; });
  tree.treeNodeCollapsed.subscribe(() => { collapsedFired = true; });

  const root = tree.nodes[0];
  assert.equal(root.expanded, false);

  // Toggle open
  await tree.toggleNode(root);
  assert.equal(root.expanded, true);
  assert.equal(expandedFired, true);

  // Toggle closed
  await tree.toggleNode(root);
  assert.equal(root.expanded, false);
  assert.equal(collapsedFired, true);

  // Select node
  const selected = await tree.selectNode("resume");
  assert.equal(selected, true);
  assert.equal(selectedNodeText, "Resume.pdf");
  assert.equal(tree.selectedNode?.value, "resume");
});

test("TreeViewController checkbox management and filtering", async () => {
  const tree = new TreeViewController({
    id: "treeChecks",
    showCheckBoxes: "Leaf",
    nodes: [
      {
        text: "Folder 1",
        value: "f1",
        childNodes: [
          { text: "Item A", value: "a" },
          { text: "Item B", value: "b" }
        ]
      }
    ]
  });

  const root = tree.nodes[0];
  const leafA = root.childNodes[0];

  assert.equal(tree.shouldShowCheckBox(root), false); // Parent/root, not leaf
  assert.equal(tree.shouldShowCheckBox(leafA), true);  // Leaf

  let lastCheckEvent = null;
  tree.treeNodeCheckChanged.subscribe((_s, e) => {
    lastCheckEvent = { nodeValue: e.node.value, checked: e.checked };
  });

  await tree.checkNode("a", true);
  assert.notEqual(lastCheckEvent, null);
  assert.equal(lastCheckEvent?.nodeValue, "a");
  assert.equal(lastCheckEvent?.checked, true);
  assert.equal(leafA.checked, true);

  const checkedList = tree.getCheckedNodes();
  assert.equal(checkedList.length, 1);
  assert.equal(checkedList[0].value, "a");

  await tree.checkNode("b", true);
  assert.equal(tree.getCheckedNodes().length, 2);

  await tree.checkNode("a", false);
  assert.equal(tree.getCheckedNodes().length, 1);
  assert.equal(tree.getCheckedNodes()[0].value, "b");
});

// -------------------------------------------------------------
// 3. SiteMapPathController Tests
// -------------------------------------------------------------

test("SiteMapPathController resolves breadcrumb path from SiteMapDataSource", async () => {
  const siteMapDs = new SiteMapDataSource({
    id: "smpDs",
    siteMap: sampleSiteMap,
    showStartingNode: true
  });

  const breadcrumbs = new SiteMapPathController({
    id: "breadCrumb",
    siteMapProvider: siteMapDs,
    pathSeparator: " > "
  });

  const items = await breadcrumbs.dataBind("/products/software/ide");

  assert.equal(items.length, 4);
  assert.equal(items[0].itemType, "Root");
  assert.equal(items[0].text, "Home");
  assert.equal(items[0].isLink, true);

  assert.equal(items[1].itemType, "Parent");
  assert.equal(items[1].text, "Products");
  assert.equal(items[1].isLink, true);

  assert.equal(items[2].itemType, "Parent");
  assert.equal(items[2].text, "Software");
  assert.equal(items[2].isLink, true);

  assert.equal(items[3].itemType, "Current");
  assert.equal(items[3].text, "Cloud IDE");
  assert.equal(items[3].isLink, false); // Default renderCurrentNodeAsLink is false

  const text = breadcrumbs.renderText();
  assert.equal(text, "Home > Products > Software > Cloud IDE");
});

test("SiteMapPathController supports CurrentToRoot direction and custom options", async () => {
  const siteMapDs = new SiteMapDataSource({
    id: "smpDs",
    siteMap: sampleSiteMap,
    showStartingNode: true
  });

  const breadcrumbs = new SiteMapPathController({
    id: "revBreadCrumb",
    siteMapProvider: siteMapDs,
    pathSeparator: " / ",
    pathDirection: "CurrentToRoot",
    renderCurrentNodeAsLink: true
  });

  const items = await breadcrumbs.dataBind("/about");

  assert.equal(items.length, 2);
  assert.equal(items[0].itemType, "Current");
  assert.equal(items[0].text, "About Us");
  assert.equal(items[0].isLink, true);

  assert.equal(items[1].itemType, "Root");
  assert.equal(items[1].text, "Home");

  assert.equal(breadcrumbs.renderText(), "About Us / Home");
});

test("SiteMapPathController limits parent levels displayed", async () => {
  const siteMapDs = new SiteMapDataSource({
    id: "smpDs",
    siteMap: sampleSiteMap,
    showStartingNode: true
  });

  const breadcrumbs = new SiteMapPathController({
    id: "limitedBreadCrumb",
    siteMapProvider: siteMapDs,
    parentLevelsDisplayed: 1 // Only 1 immediate parent level shown between Root and Current
  });

  const items = await breadcrumbs.dataBind("/products/software/ide");

  // Original path: Home -> Products -> Software -> Cloud IDE
  // With parentLevelsDisplayed: 1, intermediate [Products, Software] is truncated to [Software]
  assert.equal(items.length, 3);
  assert.equal(items[0].text, "Home");
  assert.equal(items[1].text, "Software");
  assert.equal(items[2].text, "Cloud IDE");
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  CalendarController,
  XmlController,
  AdRotatorController,
} from "../dist/index.js";

// -------------------------------------------------------------
// 1. CalendarController Tests
// -------------------------------------------------------------

test("CalendarController generates 6x7 grid matrix with proper day properties", async () => {
  const calendar = new CalendarController({
    visibleDate: new Date(2026, 8, 1), // September 2026
    firstDayOfWeek: 0, // Sunday
  });

  assert.equal(calendar.titleText, "September 2026");
  assert.equal(calendar.dayHeaders.length, 7);
  assert.equal(calendar.dayHeaders[0], "Sun");

  const matrix = await calendar.getDaysMatrix();
  assert.equal(matrix.length, 6); // 6 rows
  assert.equal(matrix[0]?.length, 7); // 7 columns
  assert.equal(matrix[5]?.length, 7);

  // Sept 1, 2026 is a Tuesday. With Sunday start:
  // Row 0: Sun Aug 30 (other), Mon Aug 31 (other), Tue Sep 1 (current), Wed Sep 2, Thu Sep 3, Fri Sep 4, Sat Sep 5
  const sunAug30 = matrix[0]?.[0];
  assert.equal(sunAug30?.isOtherMonth, true);
  assert.equal(sunAug30?.dayNumberText, "30");

  const tueSep1 = matrix[0]?.[2];
  assert.equal(tueSep1?.isOtherMonth, false);
  assert.equal(tueSep1?.dayNumberText, "1");
  assert.equal(tueSep1?.isWeekend, false);

  const satSep5 = matrix[0]?.[6];
  assert.equal(satSep5?.isWeekend, true);
});

test("CalendarController month navigation and visibleMonthChanged event", async () => {
  const calendar = new CalendarController({
    visibleDate: new Date(2026, 8, 1), // September 2026
  });

  let changedFired = false;
  let prevMonthReported = null;
  let newMonthReported = null;

  calendar.visibleMonthChanged.subscribe((_, e) => {
    changedFired = true;
    prevMonthReported = e.previousDate.getMonth();
    newMonthReported = e.newDate.getMonth();
  });

  await calendar.nextMonth();
  assert.equal(changedFired, true);
  assert.equal(prevMonthReported, 8); // Sept
  assert.equal(newMonthReported, 9);  // Oct
  assert.equal(calendar.titleText, "October 2026");

  await calendar.prevMonth();
  assert.equal(calendar.titleText, "September 2026");
});

test("CalendarController selection modes: Day, DayWeek, DayWeekMonth, and None", async () => {
  const calendar = new CalendarController({
    visibleDate: new Date(2026, 8, 1),
    selectionMode: "Day",
  });

  // Day selection
  const targetDate = new Date(2026, 8, 15);
  let selectionFired = false;
  const unsub = calendar.selectionChanged.subscribe((_, e) => {
    selectionFired = true;
    assert.equal(e.selectedDate?.getDate(), 15);
    assert.equal(e.selectedDates.length, 1);
  });

  await calendar.selectDate(targetDate);
  assert.equal(selectionFired, true);
  assert.equal(calendar.isDateSelected(targetDate), true);
  unsub();

  // SelectionMode: None
  calendar.selectionMode = "None";
  const rejected = await calendar.selectDate(new Date(2026, 8, 20));
  assert.equal(rejected, false);
  assert.equal(calendar.isDateSelected(new Date(2026, 8, 20)), false);

  // DayWeek selection
  calendar.selectionMode = "DayWeek";
  calendar.firstDayOfWeek = 0; // Sun
  await calendar.selectWeek(new Date(2026, 8, 15)); // Tuesday
  assert.equal(calendar.selectedDates.length, 7);
  // Sunday of that week is Sept 13
  assert.equal(calendar.selectedDates[0]?.getDate(), 13);
  assert.equal(calendar.selectedDates[6]?.getDate(), 19);

  // DayWeekMonth selection
  calendar.selectionMode = "DayWeekMonth";
  await calendar.selectMonth(new Date(2026, 8, 1));
  assert.equal(calendar.selectedDates.length, 30); // September has 30 days
  assert.equal(calendar.selectedDates[0]?.getDate(), 1);
  assert.equal(calendar.selectedDates[29]?.getDate(), 30);

  // Clear selection
  await calendar.clearSelection();
  assert.equal(calendar.selectedDate, null);
  assert.equal(calendar.selectedDates.length, 0);
});

test("CalendarController dayRender event intercepts and customizes cells", async () => {
  const calendar = new CalendarController({
    visibleDate: new Date(2026, 8, 1),
  });

  // Highlight Sept 15 as Special Holiday
  calendar.dayRender.subscribe((_, e) => {
    if (e.day.date.getMonth() === 8 && e.day.date.getDate() === 15) {
      e.cssClass = "holiday-cell";
      e.cellText = "15★";
      e.customMarkup = "<span class='badge'>Holiday</span>";
    }
    // Disable weekends
    if (e.day.isWeekend) {
      e.isSelectable = false;
    }
  });

  const matrix = await calendar.getDaysMatrix();
  let foundHoliday = false;
  let weekendDisabled = true;

  for (const row of matrix) {
    for (const day of row) {
      if (day.date.getMonth() === 8 && day.date.getDate() === 15) {
        foundHoliday = true;
        assert.equal(day.cssClass, "holiday-cell");
        assert.equal(day.cellText, "15★");
        assert.equal(day.customMarkup, "<span class='badge'>Holiday</span>");
      }
      if (day.isWeekend && day.isSelectable) {
        weekendDisabled = false;
      }
    }
  }

  assert.equal(foundHoliday, true);
  assert.equal(weekendDisabled, true);
});

// -------------------------------------------------------------
// 2. XmlController Tests
// -------------------------------------------------------------

test("XmlController parses XML and renders default structured HTML", async () => {
  const xmlCtrl = new XmlController({
    documentContent: `<catalog name="Gadgets"><item id="1" price="100">Wireless Mouse</item></catalog>`,
  });

  const html = await xmlCtrl.render();
  assert.ok(html.includes("catalog"));
  assert.ok(html.includes("Wireless Mouse"));
  assert.ok(html.includes("xml-attr-name"));
  assert.equal(xmlCtrl.hasError, false);
});

test("XmlController transforms XML using custom transformFunction", async () => {
  const xmlCtrl = new XmlController({
    documentContent: `
      <products>
        <product id="101"><name>Laptop</name><price>1200</price></product>
        <product id="102"><name>Keyboard</name><price>80</price></product>
      </products>
    `,
    transformFunction: (root, params) => {
      const currency = params?.currency || "$";
      const prods = root.children.filter((c) => c.name === "product");
      const listItems = prods
        .map((p) => {
          const name = p.children.find((c) => c.name === "name")?.text || "Unknown";
          const price = p.children.find((c) => c.name === "price")?.text || "0";
          return `<li>${name} - ${currency}${price}</li>`;
        })
        .join("");
      return `<ul>${listItems}</ul>`;
    },
    transformParameters: { currency: "USD " },
  });

  const output = await xmlCtrl.transform();
  assert.equal(output, "<ul><li>Laptop - USD 1200</li><li>Keyboard - USD 80</li></ul>");
  assert.equal(xmlCtrl.hasError, false);
});

test("XmlController applies basic XSLT template with for-each and value-of", async () => {
  const xmlData = `
    <inventory>
      <book category="fiction"><title>The Hobbit</title><author>Tolkien</author></book>
      <book category="tech"><title>Clean Code</title><author>Martin</author></book>
    </inventory>
  `;

  const xslt = `
    <xsl:for-each select="book">
      <div class="book-card">
        <h3><xsl:value-of select="title" /></h3>
        <p>Author: <xsl:value-of select="author" /> | Cat: <xsl:value-of select="@category" /></p>
      </div>
    </xsl:for-each>
  `;

  const xmlCtrl = new XmlController({
    documentContent: xmlData,
    transformContent: xslt,
  });

  const output = await xmlCtrl.transform();
  assert.ok(output.includes("The Hobbit"));
  assert.ok(output.includes("Author: Tolkien | Cat: fiction"));
  assert.ok(output.includes("Clean Code"));
  assert.ok(output.includes("Author: Martin | Cat: tech"));
});

test("XmlController handles malformed XML and errors gracefully", async () => {
  const xmlCtrl = new XmlController({
    documentContent: `<broken><unclosed></broken>`,
  });

  const output = await xmlCtrl.transform();
  assert.equal(xmlCtrl.hasError, true);
  assert.ok(xmlCtrl.errorMessage !== null);
  assert.ok(output.includes("xml-error"));
});

// -------------------------------------------------------------
// 3. AdRotatorController Tests
// -------------------------------------------------------------

test("AdRotatorController loads ads from XML format", async () => {
  const xmlAds = `
    <Advertisements>
      <Ad>
        <ImageUrl>https://example.com/ad1.jpg</ImageUrl>
        <NavigateUrl>https://example.com/promo1</NavigateUrl>
        <AlternateText>Summer Sale 50% Off</AlternateText>
        <Impressions>10</Impressions>
        <Keyword>Sale</Keyword>
      </Ad>
      <Ad>
        <ImageUrl>https://example.com/ad2.jpg</ImageUrl>
        <NavigateUrl>https://example.com/promo2</NavigateUrl>
        <AlternateText>Developer Cloud Platform</AlternateText>
        <Impressions>5</Impressions>
        <Keyword>Tech</Keyword>
      </Ad>
    </Advertisements>
  `;

  const rotator = new AdRotatorController();
  rotator.loadFromXml(xmlAds);

  assert.equal(rotator.advertisements.length, 2);
  assert.equal(rotator.advertisements[0]?.keyword, "Sale");
  assert.equal(rotator.advertisements[0]?.impressions, 10);
  assert.equal(rotator.advertisements[1]?.keyword, "Tech");
});

test("AdRotatorController filters by keyword and rotates ads with weights", async () => {
  const ads = [
    {
      imageUrl: "https://example.com/tech1.png",
      navigateUrl: "https://tech1.com",
      alternateText: "Tech Item 1",
      impressions: 100, // Very high weight
      keyword: "Tech",
    },
    {
      imageUrl: "https://example.com/fashion1.png",
      navigateUrl: "https://fashion1.com",
      alternateText: "Fashion Item 1",
      impressions: 50,
      keyword: "Fashion",
    },
  ];

  const rotator = new AdRotatorController({ advertisements: ads });

  // Filter by "Fashion"
  rotator.setKeywordFilter("Fashion");
  const fashionAd = await rotator.getRandomAd();
  assert.equal(fashionAd?.keyword, "Fashion");
  assert.equal(fashionAd?.alternateText, "Fashion Item 1");

  // Filter by non-matching keyword
  rotator.setKeywordFilter("NonExistent");
  const noneAd = await rotator.getRandomAd();
  assert.equal(noneAd, null);

  // Clear filter
  rotator.setKeywordFilter(undefined);
  const anyAd = await rotator.getRandomAd();
  assert.ok(anyAd !== null);
});

test("AdRotatorController adCreated event intercepts and modifies ad", async () => {
  const rotator = new AdRotatorController({
    advertisements: [
      {
        imageUrl: "https://example.com/orig.png",
        navigateUrl: "https://example.com/dest",
        alternateText: "Original Ad",
        impressions: 1,
      },
    ],
  });

  let adCreatedFired = false;
  rotator.adCreated.subscribe((_, e) => {
    adCreatedFired = true;
    e.navigateUrl = `${e.navigateUrl}?ref=webforms_campaign`;
    e.alternateText = "Intercepted Ad";
  });

  const renderResult = await rotator.render();
  assert.equal(adCreatedFired, true);
  assert.ok(renderResult !== null);
  assert.equal(renderResult?.alternateText, "Intercepted Ad");
  assert.ok(renderResult?.navigateUrl.includes("?ref=webforms_campaign"));
  assert.ok(renderResult?.html.includes("Intercepted Ad"));
});

test("Calendar selectDate/selectWeek/selectMonth respect isSelectable set in dayRender", async () => {
  const { CalendarController } = await import("../dist/index.js");
  const c = new CalendarController({ visibleDate: new Date(2026, 11, 1), selectionMode: "DayWeekMonth", firstDayOfWeek: 1 });
  c.dayRender.subscribe((_s, e) => { if (e.day.date.getDate() === 25) e.isSelectable = false; });

  assert.equal(await c.selectDate(new Date(2026, 11, 25)), false);          // vetoed
  assert.equal(c.getState().selectedDates.length, 0);
  assert.equal(await c.selectDate(new Date(2026, 11, 24)), true);
  assert.equal(c.getState().selectedDates.length, 1);

  assert.equal(await c.selectWeek(new Date(2026, 11, 24)), true);           // week of Mon 21 .. Sun 27 without the 25th
  const week = c.getState().selectedDates.map((d) => d.getDate());
  assert.deepEqual(week, [21, 22, 23, 24, 26, 27]);

  assert.equal(await c.selectMonth(new Date(2026, 11, 10)), true);
  const month = c.getState().selectedDates;
  assert.equal(month.length, 30);                                            // 31 days minus the 25th
  assert.ok(!month.some((d) => d.getDate() === 25));

  c.dayRender.clear();
  c.dayRender.subscribe((_s, e) => { e.isSelectable = false; });
  assert.equal(await c.selectWeek(new Date(2026, 11, 10)), false);           // nothing selectable at all
  assert.equal(await c.selectMonth(new Date(2026, 11, 10)), false);
});

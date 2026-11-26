import { EventDispatcher } from "../events.js";
export class AdRotatorController {
    id;
    advertisementFile;
    keywordFilter;
    target;
    _advertisements = [];
    _lastSelectedAd = null;
    adCreated = new EventDispatcher();
    stateChanged = new EventDispatcher();
    constructor(options = {}) {
        this.id = options.id ?? `AdRotator_${Math.random().toString(36).substring(2, 9)}`;
        this.advertisementFile = options.advertisementFile;
        this.keywordFilter = options.keywordFilter;
        this.target = options.target ?? "_blank";
        if (options.advertisements) {
            this.loadAds(options.advertisements);
        }
    }
    get advertisements() {
        return [...this._advertisements];
    }
    get lastSelectedAd() {
        return this._lastSelectedAd;
    }
    loadAds(ads) {
        this._advertisements = ads.map((ad) => ({
            imageUrl: ad.imageUrl,
            navigateUrl: ad.navigateUrl,
            alternateText: ad.alternateText,
            impressions: Math.max(1, ad.impressions),
            keyword: ad.keyword,
            caption: ad.caption,
            width: ad.width,
            height: ad.height,
            customAttributes: ad.customAttributes ? { ...ad.customAttributes } : undefined,
        }));
        this.emitState();
    }
    loadFromXml(xmlString) {
        const cleanXml = xmlString.replace(/<\?xml[^>]*\?>/gi, "").trim();
        const adTagRegex = /<Ad>([\s\S]*?)<\/Ad>/gi;
        const loaded = [];
        let adMatch;
        while ((adMatch = adTagRegex.exec(cleanXml)) !== null) {
            const adContent = adMatch[1] ?? "";
            const getVal = (tag) => {
                const r = new RegExp(`<${tag}>([^<]*)<\\/${tag}>`, "i");
                const m = r.exec(adContent);
                return m && m[1] ? m[1].trim() : "";
            };
            const imageUrl = getVal("ImageUrl");
            const navigateUrl = getVal("NavigateUrl");
            const alternateText = getVal("AlternateText");
            const impressionsStr = getVal("Impressions");
            const keyword = getVal("Keyword");
            const caption = getVal("Caption");
            if (imageUrl) {
                loaded.push({
                    imageUrl,
                    navigateUrl: navigateUrl || "#",
                    alternateText: alternateText || "Advertisement",
                    impressions: impressionsStr ? parseInt(impressionsStr, 10) || 1 : 1,
                    keyword: keyword || undefined,
                    caption: caption || undefined,
                });
            }
        }
        this.loadAds(loaded);
    }
    setKeywordFilter(filter) {
        this.keywordFilter = filter;
        this.emitState();
    }
    async getRandomAd() {
        let eligible = this._advertisements;
        if (this.keywordFilter && this.keywordFilter.trim().length > 0) {
            const filterLower = this.keywordFilter.trim().toLowerCase();
            eligible = eligible.filter((ad) => ad.keyword && ad.keyword.toLowerCase().includes(filterLower));
        }
        if (eligible.length === 0) {
            this._lastSelectedAd = null;
            return null;
        }
        // Weighted random selection based on impressions
        const totalWeight = eligible.reduce((acc, ad) => acc + ad.impressions, 0);
        const randomVal = Math.random() * totalWeight;
        let runningSum = 0;
        let chosenAd = eligible[0];
        for (const ad of eligible) {
            runningSum += ad.impressions;
            if (randomVal <= runningSum) {
                chosenAd = ad;
                break;
            }
        }
        // Clone chosen ad to allow adCreated interception
        const adProperties = {
            imageUrl: chosenAd.imageUrl,
            navigateUrl: chosenAd.navigateUrl,
            alternateText: chosenAd.alternateText,
            keyword: chosenAd.keyword,
            impressions: chosenAd.impressions,
        };
        const eventArgs = {
            adProperties,
            imageUrl: chosenAd.imageUrl,
            navigateUrl: chosenAd.navigateUrl,
            alternateText: chosenAd.alternateText,
        };
        await this.adCreated.emit(this, eventArgs);
        const finalizedAd = {
            ...chosenAd,
            imageUrl: eventArgs.imageUrl,
            navigateUrl: eventArgs.navigateUrl,
            alternateText: eventArgs.alternateText,
        };
        this._lastSelectedAd = finalizedAd;
        this.emitState();
        return finalizedAd;
    }
    async render() {
        const ad = await this.getRandomAd();
        if (!ad)
            return null;
        const html = `<a href="${ad.navigateUrl}" target="${this.target}"><img src="${ad.imageUrl}" alt="${ad.alternateText}" title="${ad.alternateText}" /></a>`;
        return {
            imageUrl: ad.imageUrl,
            navigateUrl: ad.navigateUrl,
            alternateText: ad.alternateText,
            target: this.target,
            html,
        };
    }
    getState() {
        return {
            keywordFilter: this.keywordFilter,
            target: this.target,
            adCount: this._advertisements.length,
            lastSelectedAd: this._lastSelectedAd,
        };
    }
    emitState() {
        this.stateChanged.emit(this, this.getState());
    }
}
//# sourceMappingURL=ad-rotator.js.map
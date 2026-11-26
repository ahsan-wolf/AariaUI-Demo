import { EventDispatcher } from "../events.js";
export interface AdvertisementItem {
    imageUrl: string;
    navigateUrl: string;
    alternateText: string;
    impressions: number;
    keyword?: string | undefined;
    caption?: string | undefined;
    width?: number | undefined;
    height?: number | undefined;
    customAttributes?: Record<string, string> | undefined;
}
export interface AdCreatedEventArgs {
    adProperties: Record<string, unknown>;
    alternateText: string;
    imageUrl: string;
    navigateUrl: string;
}
export interface AdRotatorOptions {
    id?: string | undefined;
    advertisementFile?: string | undefined;
    advertisements?: AdvertisementItem[] | undefined;
    keywordFilter?: string | undefined;
    target?: string | undefined;
}
export interface AdRotatorRenderResult {
    imageUrl: string;
    navigateUrl: string;
    alternateText: string;
    target: string;
    html: string;
}
export interface AdRotatorState {
    keywordFilter?: string | undefined;
    target: string;
    adCount: number;
    lastSelectedAd: AdvertisementItem | null;
}
export declare class AdRotatorController {
    readonly id: string;
    advertisementFile?: string | undefined;
    keywordFilter?: string | undefined;
    target: string;
    private _advertisements;
    private _lastSelectedAd;
    readonly adCreated: EventDispatcher<AdRotatorController, AdCreatedEventArgs>;
    readonly stateChanged: EventDispatcher<AdRotatorController, AdRotatorState>;
    constructor(options?: AdRotatorOptions);
    get advertisements(): AdvertisementItem[];
    get lastSelectedAd(): AdvertisementItem | null;
    loadAds(ads: AdvertisementItem[]): void;
    loadFromXml(xmlString: string): void;
    setKeywordFilter(filter?: string | undefined): void;
    getRandomAd(): Promise<AdvertisementItem | null>;
    render(): Promise<AdRotatorRenderResult | null>;
    getState(): AdRotatorState;
    private emitState;
}

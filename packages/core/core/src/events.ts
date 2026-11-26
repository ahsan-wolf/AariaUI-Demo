export type MaybePromise<T> = T | Promise<T>;
export type EventHandler<TSender, TArgs> = (sender: TSender, args: TArgs) => MaybePromise<void>;

export class EventDispatcher<TSender, TArgs> {
  private readonly handlers = new Set<EventHandler<TSender, TArgs>>();

  subscribe(handler: EventHandler<TSender, TArgs>): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  async emit(sender: TSender, args: TArgs): Promise<void> {
    for (const handler of [...this.handlers]) await handler(sender, args);
  }

  clear(): void { this.handlers.clear(); }
}

export interface CancelEventArgs { cancel: boolean; }
export interface DataBindingEventArgs { itemCount: number; }
export interface GridRowEventArgs<T> { rowIndex: number; dataItem: T; }
export interface GridCommandEventArgs<T> extends GridRowEventArgs<T> {
  commandName: string;
  commandArgument?: unknown;
}
export interface GridCancelableRowEventArgs<T> extends GridRowEventArgs<T>, CancelEventArgs {}
export interface GridPageEventArgs extends CancelEventArgs { oldPageIndex: number; newPageIndex: number; }
export interface GridSortEventArgs extends CancelEventArgs { sortExpression: string; direction: SortDirection; }
export interface GridUpdateEventArgs<T> extends GridCancelableRowEventArgs<T> { values: Partial<T>; }
export type RepeaterItemType = "Header" | "Item" | "AlternatingItem" | "Separator" | "Footer";
export interface RepeaterItemEventArgs<T> { itemIndex: number; itemType: RepeaterItemType; dataItem?: T; }
export interface RepeaterCommandEventArgs<T> extends RepeaterItemEventArgs<T> { commandName: string; commandArgument?: unknown; }
export interface RepeaterValueEventArgs<T> extends RepeaterItemEventArgs<T> { dataMember?: string; value?: T; }
export interface RepeaterCancelableItemEventArgs<T> extends RepeaterItemEventArgs<T>, CancelEventArgs {}
export interface RepeaterUpdateEventArgs<T> extends RepeaterCancelableItemEventArgs<T> { values: Partial<T>; }
export type SortDirection = "asc" | "desc";

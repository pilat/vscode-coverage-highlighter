export interface IFluxAction {
    type: string;
    [key: string]: any;
}

export interface IFluxOptions {
    store: IStore;
    middlewares?: IMiddleware[];
}

export interface IStore {
    initialState(): object;
    onAction(type: string, data: any, state: object): object;
}

export interface IMiddleware {
    preDispatch(action: IFluxAction, state: object): void;
    postDispatch(action: IFluxAction, state: object): void;
}

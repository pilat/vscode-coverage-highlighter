import { Disposable } from 'vscode';
import get from 'lodash/get';
import { IFluxAction, IFluxOptions, IStore, IMiddleware } from './types';
import {EventEmitter} from 'events';


export class FluxFramework extends EventEmitter {
    private store: IStore;
    private isInit: boolean = false;
    private middlewares: IMiddleware[] = [];
    private _state: object|undefined;

    public init(options: IFluxOptions) {
        if (this.isInit) {
            throw new Error('Flux has already inited');
        }

        this.store = options.store;
        for (const middleware of options.middlewares || []) {
            this.middlewares.push(middleware);
        }

        this.isInit = true;
        return this;
    }

    public reset() {
        // TODO: What about disposables?...
        this.removeAllListeners();
        this.middlewares = [];
        this.isInit = false;
        this._state = undefined;
    }

    // @ts-ignore: Override EventEmitter
    public on(eventType: string, listener: (...args: any[]) => void, thisArg?: any, disposables?: Disposable[]): this {
        const bindableListener = thisArg ? listener.bind(thisArg) : listener;
        if (disposables) {
            disposables.push({
                dispose: () => {
                    this.removeListener(eventType, bindableListener);
                }
            });
        }
        return this.addListener(eventType, bindableListener);
    }

    // @ts-ignore Override EventEmitter
    public off(eventType: string, listener: (...args: any[]) => void): this {
        return this.removeListener(eventType, listener);
    }

    public get state(): object {
        if (this._state === undefined) {
            this._state = this.store.initialState();
        }
        return this._state;
    }

    public dispatch(action: IFluxAction) {
        const {type, ...data} = action;
        
        for (const m of this.middlewares) {
            m.preDispatch(action, this.state);
        }

        this._state = this.store.onAction(type, data, this.state);

        for (const m of this.middlewares) {
            m.postDispatch(action, this.state);
        }

        this.emit(type, action);
    }

    public getState(path: string | string[] = '', defaultValue?: any): any {
        let value;

        if (!path) {
            value = this.state;
        } else {
            value = get(this.state, path);
        }

        return value === undefined ? defaultValue : value;
    }
}

export const Flux: FluxFramework = new FluxFramework();

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
    public on(eventType: string, listener: (...args: any[]) => void, thisArgs: any, disposables: Disposable[]): this {
        const bindableListener = listener.bind(thisArgs);
        disposables.push({
            dispose: () => {
                this.removeListener(eventType, bindableListener);
            }
        });
        return this.addListener(eventType, bindableListener);
    }

    public get state(): object {
        return this._state || this.store.initialState();
    }

    public dispatch(action: IFluxAction) {
        if (!action) {
            throw new Error('Empty action');
        }

        const {type, ...data} = action;
        if (!action.type) {
            throw new Error('Invalid action type');
        }

        for (const m of this.middlewares) {
            if (m.preDispatch) {
                m.preDispatch(action, this.state);
            }
        }

        this._state = this.store.onAction(type, data, this.state);

        for (const m of this.middlewares) {
            if (m.postDispatch) {
                m.postDispatch(action, this.state);
            }
        }

        this.emit(type, action);
        // return Promise.resolve(clonedAction);
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

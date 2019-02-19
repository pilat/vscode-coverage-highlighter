import { IMiddleware, IFluxAction } from './../src/flux/types';
import { Flux } from '../src/flux/flux';
import { IExtensionApi, ICoverageFile } from './../src/types';
import { AppStore } from './../src/store';
import * as vscode from 'vscode';
import fs from 'fs';
import * as os from 'os';
import { join } from 'path';
import { randomId } from '../src/helpers/utils';
import cloneDeep from 'lodash/cloneDeep';


export const FILES_DIR = join(__dirname, '../../test/files');
export const EXAMPLE_WORKSPACE = join(__dirname, '../../test/example');
export const COVERAGE_FILE: ICoverageFile = { uri: join(FILES_DIR, 'lcov.info'), folder: FILES_DIR };


export function createRandomFile(contents = '', ext= ''): Promise<vscode.Uri> {
    return new Promise((resolve, reject) => {
        const tmpFile = join(os.tmpdir(), randomId() + (ext ? '.' + ext : ''));
        fs.writeFile(tmpFile, contents, (error) => {
            if (error) {
                return reject(error);
            }

            resolve(vscode.Uri.file(tmpFile));
        });
    });
}

export function closeAllEditors() {
    return vscode.commands.executeCommand('workbench.action.closeAllEditors');
}

export function sleep(ms: number = 10) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getTestStore() {
    // Unload extension
    const myExtension = vscode.extensions.getExtension('brainfit.vscode-coverage-highlighter');
    await myExtension.activate();
    const myProvider = myExtension.exports as IExtensionApi;
    myProvider.dispose();

    // Setup test flux store
    const storeKeeper = new StoreKeepeer();
    Flux.reset();
    Flux.init({ store: new AppStore(), middlewares: [storeKeeper] });
    return storeKeeper;
}

export async function newFile() {
    const file = await createRandomFile('var content = "123";', 'js');
    const doc = await vscode.workspace.openTextDocument(file);
    await vscode.window.showTextDocument(doc);
}

export async function openFile(fileName: string = 'index.ts') {
    // const exampleFolder = join(__dirname, '../../', 'example');
    // const exampleFolderUri = vscode.Uri.file(exampleFolder);
    const exampleFile = join(EXAMPLE_WORKSPACE, fileName);
    // await vscode.commands.executeCommand('vscode.openFolder', exampleFolderUri);
    // await sleep(1000);
    const doc = await vscode.workspace.openTextDocument(exampleFile);
    await vscode.window.showTextDocument(doc, { preview: false });
}


export interface IHistory {
    previousStore: any;
    newStore: any;
    actionType: string;
}

export class StoreKeepeer implements IMiddleware {
    public _history: IHistory[] = [];
    private previousState: object;
    private currentState: object;
    private _lastActionType: string = '';
    private _actions: string[] = [];

    public get state(): any {
        return this.currentState;
    }

    public get lastActionType() {
        return this._lastActionType;
    }

    public preDispatch(_action: IFluxAction, state: object){
        this.previousState = cloneDeep(state);
        // this.previousAction = cloneDeep(action);
    }

    public postDispatch(action: IFluxAction, state: object){
        this.currentState = cloneDeep(state);
        this._lastActionType = action.type;
        this._history.push({
            previousStore: this.previousState,
            newStore: this.currentState,
            actionType: action.type
        });
        this._actions.push(action.type);
    }

    public getHistoryAction(index: number = 0) {
        const realIndex = this._history.length - 1 - index;
        return this._history[realIndex].actionType;
    }

    public hasAction(action: string): boolean {
        return this._actions.indexOf(action) !== -1;
    }
}

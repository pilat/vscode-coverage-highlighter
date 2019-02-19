import { ICoverageFragment } from './types';
import { TextEditor, WorkspaceFolder } from 'vscode';


export interface IParser {
    getInfo(): IParserInfo;
    getReport(): Promise<ICoverageReport>;
}

export interface IParserInfo {
    name: string;
    priority: number;
    hasAdditionalColor: boolean;
}

export interface IProvider {
    activate(): void;
    dispose(): void;
}

export interface IWatcher {
    dispose(): void;
}

export type TParser = new(...args: any[]) => IParser;
export type TProvider = new(editor: TextEditor) => IProvider;
export type TWatcher = new(folder: WorkspaceFolder) => IWatcher;


export interface IConfig {
    files: string[];
    isWholeLine: boolean;
    defaultState: boolean;
    redBgColor: string|undefined;
    greenBgColor: string|undefined;
    showDiagnostic: boolean;
}


// flux
export interface IAppState {
    displayCoverage: boolean;
    tasks: ITask;
    config: IConfig;
    files: ICoverageFile[];
    coverage: ICoverageMap;
    coverageStat: ICoverageStat|undefined;  // for current, active editor
}

export type ITask = (number|string)[];

export interface ICoverageMap {
    [filename: string]: ICoverage;
}

export interface ICoverageFile {
    uri: string;  // fsPath
    folder: string;  // fsPath
}

interface IAddCoverageFileEvent {
    type: typeof AppAction.ADD_COVERAGE_FILE;
    coverageFile: ICoverageFile;
}

interface IRemoveCoverageFileEvent {
    type: typeof AppAction.REMOVE_COVERAGE_FILE;
    coverageFile: ICoverageFile;
}

export type CoverageFileActionTypes = IAddCoverageFileEvent | IRemoveCoverageFileEvent;


export enum AppAction {
    SET_CONFIG = 'SET_CONFIG',  // First time. Before application has been inited
    APP_INIT = 'APP_INIT',

    UPDATE_CONFIG = 'UPDATE_CONFIG',  // When application works and someone is changing configuration

    // Coverage watcher find files
    ADD_TASK_ID = 'ADD_TASK_ID',  // randomHash
    REMOVE_TASK_ID = 'REMOVE_TASK_ID',  // randomHash

    // Coverage files
    ADD_COVERAGE_FILE = 'ADD_COVERAGE_FILE',  // coverageFile: ICoverageFile
    REMOVE_COVERAGE_FILE = 'REMOVE_COVERAGE_FILE',  // coverageFile: ICoverageFile

    // Add or remove from report...
    SET_FILES_MAP = 'SET_FILES_MAP',  // map: kv[file] -> ICoverage

    // Status bar:
    UPDATE_COVERAGE_STAT = 'UPDATE_COVERAGE_STAT',  // stat: ICoverageStat or undefined
    TOGGLE_COVERAGE_DISPLAYING = 'TOGGLE_COVERAGE_DISPLAYING'
}


export interface IExtensionApi {
    dispose(): void;
}


////////////////////// Coverage
export type ICoverageReport = ICoverage[];
// export type ICoverageFragments = ICoverageFragmentBase[];

export interface ICoverage {
    file: string;
    stat?: ICoverageStat;
    fragments: ICoverageFragmentBase[];
    parserInfo: IParserInfo;
}

export interface ICoverageStat {
    label: string;
    tooltip?: string;
}

export interface ICoverageFragmentBase {
    start: ICoveragePosition;
    end: ICoveragePosition;
    color: CoverageColor;
    note?: string;
}

export interface ICoveragePosition {
    line: number;
    column?: number;
}

export enum CoverageColor {
    GREEN_BG = 0b01, // covered line
    GREEN = 0b10, // covered fragment or line
    RED = 0b11 // uncovered fragment or line
}



// Coverage utils

export interface ICoverageCollectionStat {
    covered: number;
    uncovered: number;
    total: number;
}

export interface ICoverageCollection {  // TODO: see also ICoverage
    addItem(fragment: ICoverageFragment): void;
    removeItem(fragment: ICoverageFragment): void;
    merge(collection: ICoverageCollection): ICoverageCollection;
    // dump(): ICoverageFragments;
    readonly items: Set<ICoverageFragment>;
    dump(): ICoverageFragmentBase[];
    normalize(): void;
    readonly stat: ICoverageCollectionStat;
    maxColumns: number;

}

export interface ICoverageFragment { // TODO: See ICoverageFragmentBase
    // constructor(props: ICoverageFragmentBase);
    flatStart: number;
    flatEnd: number;
    length: number;
    dump(): ICoverageFragmentBase;
    clone(): ICoverageFragment;
    isCollisionWith(fragment: ICoverageFragment): boolean;
    collection: ICoverageCollection;
    toString(): string;
    addNoteFrom(fragment: ICoverageFragment): void;

    readonly start: ICoveragePosition;
    readonly end: ICoveragePosition;
    readonly color: CoverageColor;
    readonly note?: string;
}

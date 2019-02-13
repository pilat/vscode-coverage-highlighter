import { TextEditor, WorkspaceFolder } from 'vscode';


export interface IParser {
    readonly name: string;
    readonly priority: number;
    getReport(): Promise<ICoverageReport>;
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
}


// flux
export interface IAppState {
    displayCoverage: boolean;
    tasks: ITask[];
    config: IConfig;
    files: ICoverageFile[];
    coverage: ICoverageMap;
    coverageStat: ICoverageStat|undefined;  // for current, active editor
}

export type ITask = (number|string)[];

export interface ICoverageMap {
    [key: string]: ICoverage;
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
    ADD_FILES_MAP = 'ADD_FILES_MAP',  // map: kv[file] -> ICoverage
    REDUCE_FILES_MAP = 'REDUCE_FILES_MAP',  // files

    // Status bar:
    UPDATE_COVERAGE_STAT = 'UPDATE_COVERAGE_STAT',  // stat: ICoverageStat or undefined
    TOGGLE_COVERAGE_DISPLAYING = 'TOGGLE_COVERAGE_DISPLAYING'
}


export interface IExtensionApi {
    dispose(): void;
}


////////////////////// Coverage
export type ICoverageReport = ICoverage[];
export type ICoverageFragments = ICoverageFragment[];

export interface ICoverage {
    priority: number;  // parser's value
    file: string;
    stat?: ICoverageStat;
    fragments: ICoverageFragments;
    withGreenBg?: boolean;
}

export interface ICoverageStat {
    label: string;
    tooltip?: string;
}

export interface ICoverageFragment {
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

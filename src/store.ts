import {IStore} from './flux';
import { AppAction, IAppState, ICoverageFile, IConfig, ICoverageMap, ICoverageStat } from './types';


export class AppStore implements IStore {
    public initialState(): IAppState {
        // Define default values.
        return {
            displayCoverage: true,  // current status
            tasks: [],  // Any tasks ids will be added there.. It will be used for progress
            config: {
                files: [],
                isWholeLine: true,
                defaultState: true,
                redBgColor: undefined,
                greenBgColor: undefined
            },
            files: [],  // Coverage files
            coverage: {},  // Associative map with project files. source -> coverage ino
            coverageStat: undefined
        };
    }

    public onAction(type: string, data: any, state: IAppState): IAppState {
        // console.log('Action: %s', type);
        switch (type) {
            case AppAction.APP_INIT:
                return {
                    ...state,
                    displayCoverage: !!state.config.defaultState
                };
            case AppAction.SET_CONFIG:
            case AppAction.UPDATE_CONFIG:
                const config: IConfig = data.config;
                return {...state, config: config};
            case AppAction.TOGGLE_COVERAGE_DISPLAYING:
                return {...state, displayCoverage: !state.displayCoverage};
            case AppAction.ADD_TASK_ID:
                const randomHash: string = data.randomHash;
                return {
                    ...state,
                    tasks: [
                        ...state.tasks,
                        randomHash
                    ]
                };
            case AppAction.REMOVE_TASK_ID:
                const randomHash2: string = data.randomHash;
                return {
                    ...state,
                    tasks: [...state.tasks.filter((o) => o !== randomHash2)]
                };
            case AppAction.ADD_COVERAGE_FILE:
                const coverageFile1: ICoverageFile = data.coverageFile;
                return {
                    ...state,
                    files: [
                        ...state.files,
                        coverageFile1
                    ]
                };
            case AppAction.REMOVE_COVERAGE_FILE:
                const coverageFile2: ICoverageFile = data.coverageFile;
                return {
                    ...state,
                    files: state.files.filter((o) => o.uri !== coverageFile2.uri || o.folder !== coverageFile2.folder)
                };
            case AppAction.ADD_FILES_MAP:
                const coverageMap: ICoverageMap = data.map;
                return {
                    ...state,
                    coverage: {
                        ...state.coverage,
                        ...coverageMap
                    }
                };
            case AppAction.REDUCE_FILES_MAP:
                const coverageCopy = {...state.coverage};
                for (const file of (data.files as string[])) {
                    delete coverageCopy[file];
                }
                return {
                    ...state,
                    coverage: coverageCopy
                };
            case AppAction.UPDATE_COVERAGE_STAT:
                const coverageStat: ICoverageStat|undefined = data.stat;
                return {
                    ...state,
                    coverageStat
                };
        default:
            return state;
        }
    }
}

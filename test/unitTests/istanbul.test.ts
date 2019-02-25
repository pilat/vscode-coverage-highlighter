import { ICoverageFragmentBase, CoverageColor } from './../../src/types';
import * as assert from 'assert';
import { IstanbulParser } from '../../src/parsers/istanbulParser';
import { ICoverage, IParser, IParserInfo } from '../../src/types';


function getParser(obj: any): IParser {
    return new IstanbulParser(JSON.stringify(obj), '');
}

function hasFragment(fragments: ICoverageFragmentBase[], color: number, start: [number, number], end: [number, number], debug?: boolean): boolean {
    if (debug) {
        console.warn('Find fragment [%s]-[%s] (%s)', start, end, color)
        for (let frag of fragments) {
            console.warn('Fragment [%s]-[%s] (%s)', [frag.start.line+1, frag.start.column], [frag.end.line+1, frag.end.column], frag.color);
        }
    }

    for (let frag of fragments) {
        const isEq = frag.color === color &&
            frag.start.line === start[0] - 1 && 
            frag.start.column === start[1] && 
            frag.end.line === end[0] - 1 && 
            frag.end.column === end[1];
        if (isEq) {
            return true;
        }
    }
    return false;
}


const defaultStructure = {
    file: {
        path: 'file',
        statementMap: {},
        s: {},
        branchMap: {},
        b: {},
        fnMap: {},
        f: {}
    }
};


describe('Istanbul parser', () => {
    let info: IParserInfo;
    let reports: ICoverage[];

    beforeEach(async () => {
        const parser = getParser(defaultStructure)
        reports = await parser.getReport()
        info = parser.getInfo()
    });

    it('should satisfy certian files', () => {
        assert.ok(IstanbulParser.testFormat('.json', '.. .. .. "path":.... '))
    });

    it('should parse valid report', () => {
        assert.strictEqual(reports.length, 1);
    });

    it('should provide valid parser info', () => {
        assert.strictEqual(info.name, 'istanbul')
        assert.ok(info.hasAdditionalColor)
    });

    it('should contain valid filename', () => {
        assert.ok(reports[0].file === 'file')
    });

    it('should contain stat and tooltip', () => {
        assert.ok(reports[0].stat)
        assert.ok(reports[0].stat.tooltip)
    });

    it('should return coverage label 0%', () => {
        assert.strictEqual(reports[0].stat.label, '0%')
    });

    it('should return coverage stat 0%', () => {
        assert.strictEqual(reports[0].stat.tooltip, 'Statements: 0% (0/0)\nBranches: 0% (0/0)\nFunctions: 0% (0/0)')
    });
});


describe('Coverage report (with statements only)', () => {
    let reports: ICoverage[];

    beforeEach(async () => {
        const file = {
            ...defaultStructure,
            file: {
                ...defaultStructure.file,
                statementMap: {
                    "1": {
                        start: { line: 1,  column: 0 },
                        end:   { line: 1,  column: 34 }
                    },
                    "2": {  // will be absorbed
                        start: { line: 1,  column: 10 },
                        end:   { line: 1,  column: 15 }
                    },
                    "3": { // will be attached to 1st block
                        start: { line: 1,  column: 0 },
                        end:   { line: 3,  column: 15 }
                    },
                    "4": {
                        start: { line: 8,  column: 0 },
                        end:   { line: 21, column: 1 }
                    },
                    "5": {
                        start: { line: 4,  column: 0 },
                        end:   { line: 5,  column: 14 }
                    }
                },
                s: {
                    "1": 2,
                    "2": 5,
                    "3": 0,
                    "4": 0,
                    "5": 0
                }
            }
        };

        reports = await getParser(file).getReport()
    });

    it('should return valid coverage label', () => {
        assert.strictEqual(reports[0].stat.label, '40%');
    });

    it('should return valid coverage tooltip', () => {
        assert.strictEqual(reports[0].stat.tooltip,
            'Statements: 40% (2/5)\nBranches: 0% (0/0)\nFunctions: 0% (0/0)')
    });
});


describe('Coverage report (with functions only)', () => {
    let reports: ICoverage[];

    beforeEach(async () => {
        const file = {
            ...defaultStructure,
            file: {
                ...defaultStructure.file,
                fnMap: {
                    "1": {
                        name: '(anonymous_0)',
                        line: 9,
                        loc: {
                            start: { line: 9,  column: 4 },
                            end:   { line: 11,  column: 5 }
                        }
                    },
                    "2": { // reverse start/end (1)
                        name: '(anonymous_1)',
                        line: 13,
                        loc: {
                            start: { line: 15,  column: 5 },
                            end:   { line: 13,  column: 15 },
                        }
                    },
                    "3": { // reverse start/end (2)
                        name: '(anonymous_1)',
                        line: 13,
                        loc: {
                            start: { line: 30,  column: 20 },
                            end:   { line: 30,  column: 1 },
                        }
                    },
                    "4": { // contains strange location
                        name: '(anonymous_2)',
                        line: 16,
                        loc: {
                            start: { line: 16,  column: 0 },
                            end:   { line: 16,  column: -1 }
                        }
                    },
                    "5": { // should be ignored
                        name: '(anonymous_3)',
                        line: 17,
                        loc: {
                            start: { line: 17,  column: 18 },
                            end:   { line: 20,  column: 5 }
                        },
                        skip: true
                    }
                },
                f: {
                    "1": 2,
                    "2": 0,
                    "3": 0,
                    "4": 1,
                    "5": 21,
                }
            }
        };

        reports = await getParser(file).getReport()
    });

    it('should return valid coverage label', () => {
        assert.strictEqual(reports[0].stat.label, '50%');
    });

    it('should return valid coverage tooltip', () => {
        assert.strictEqual(reports[0].stat.tooltip,
            'Statements: 0% (0/0)\nBranches: 0% (0/0)\nFunctions: 50% (2/4)')
    });

    it('should swap start and end if it nessesary (1)', () => {
        assert.ok(hasFragment(reports[0].fragments,
            CoverageColor.RED, [13, 15], [15, 5]));
    });

    it('should swap start and end if it nessesary (2)', () => {
        assert.ok(hasFragment(reports[0].fragments,
            CoverageColor.RED, [30, 1], [30, 20]));
    });

    it('should fix and consider negative locations', () => {
        assert.ok(hasFragment(reports[0].fragments,
            CoverageColor.GREEN, [16, 0], [16, 1]));
    });

    it('should ignore skipped functions', () => {
        assert.ok(!hasFragment(reports[0].fragments,
            CoverageColor.GREEN, [17, 18], [20, 5]));
    });
});


describe('Coverage report (with branches only)', () => {
    let reports: ICoverage[];

    beforeEach(async () => {
        const file = {
            ...defaultStructure,
            file: {
                ...defaultStructure.file,
                branchMap: {
                    "1": {
                        line: 33,
                        type: 'binary-expr',
                        locations: [
                            {
                                start: {line: 33, column: 15},
                                end: {line: 33, column: 42}
                            },
                            {
                                start: {line: 33, column: 46},
                                end: {line: 33, column: 70}
                            }
                        ]
                    },
                    "2":{
                        line: 52,
                        type: 'cond-expr',
                        locations:[
                            {
                                start: {line: 52, column: 47},
                                end: {line: 52, column: 54}
                            },
                            {
                                start: {line: 52, column: 57},
                                end: {line: 52, column: 62}
                            }
                        ]
                    },
                    "3":{  // 4
                        line: 60,
                        type: 'if',
                        locations: [
                            {
                                start: {line: 60, column: 8},
                                end: {line: 62, column: 9}
                            },
                            {
                                start: {line: 60, column: 8},
                                end: {line: 62, column: 9}
                            }
                        ],
                    }
                },
                b: {
                    "1": [52, 3],
                    "2": [0, 25],
                    "3": [25, 0]
                }
            }
        };

        reports = await getParser(file).getReport()
    });

    it('should return valid coverage label', () => {
        assert.strictEqual(reports[0].stat.label, '67%');
    });

    it('should return valid coverage tooltip', () => {
        assert.strictEqual(reports[0].stat.tooltip,
            'Statements: 0% (0/0)\nBranches: 67% (4/6)\nFunctions: 0% (0/0)')
    });
});



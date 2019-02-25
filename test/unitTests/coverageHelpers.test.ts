import { CoverageCollection } from './../../src/helpers/coverageCollection';
import { ICoverageCollection } from './../../src/types';
import { CoverageFlatFragment } from './../../src/helpers/coverageFlatFragmet';
import { CoverageFragment } from './../../src/helpers/coverageFragment';
import * as assert from 'assert';
import { ICoverageFragment, CoverageColor } from '../../src/types';


describe('CoverageFragment', () => {
    let fragment: ICoverageFragment;

    beforeEach(() => {
        fragment = new CoverageFragment({
            start: {line: 1, column: 0},
            end: {line: 10, column: 20},
            color: CoverageColor.GREEN,
            note: 'Text note'
        })
    });

    it('should keep color', () => {
        assert.strictEqual(fragment.color, CoverageColor.GREEN)
    });

    it('should keep note', () => {
        assert.strictEqual(fragment.note, 'Text note')
    });

    it('should keep start and end', () => {
        assert.strictEqual(fragment.start.line, 1)
        assert.strictEqual(fragment.start.column, 0)
        assert.strictEqual(fragment.end.line, 10)
        assert.strictEqual(fragment.end.column, 20)
    });
    
    it('should supporting dump()', () => {
        assert.deepStrictEqual(fragment.dump(), {
            note: 'Text note',
            color: 2,
            start: {line: 1, column: 0},
            end: {line: 10, column: 20}, 
        })
    });

    it('should support clone which creating new object', () => {
        const newFragment = fragment.clone();
        assert.ok(newFragment !== fragment);
        assert.deepStrictEqual(fragment.dump(), newFragment.dump())
    });

    it('can be converted to flat coordinates', () => {
        const collection = new CoverageCollection();
        collection.addItem(fragment)
        // @ts-ignore Test
        collection._freeze();
        assert.strictEqual(fragment.flatStart, 21);
        assert.strictEqual(fragment.flatEnd, 230);
    });

    it('can be converted back to normal coordinates', () => {
        const collection = new CoverageCollection();
        collection.addItem(fragment)
        // @ts-ignore Test
        collection._freeze();
        fragment.flatStart = 21 + 3; // shift to right on 3 characters
        assert.strictEqual(fragment.start.line, 1);
        assert.strictEqual(fragment.start.column, 3);  // instead 1
    });
});


describe('CoverageFlatFragment', () => {
    let fragment: ICoverageFragment;

    beforeEach(() => {
        fragment = new CoverageFlatFragment({
            start: {line: 1, column: 10},
            end: {line: 10},
            color: CoverageColor.GREEN,
            note: 'Text note'
        })
    });

    it('should keep color', () => {
        assert.strictEqual(fragment.color, CoverageColor.GREEN)
    });

    it('should keep note', () => {
        assert.strictEqual(fragment.note, 'Text note')
    });

    it('should keep start and end', () => {
        assert.strictEqual(fragment.start.line, 1);
        assert.strictEqual(fragment.end.line, 10);
    });

    it('should contain empty columns', () => {
        assert.strictEqual(fragment.start.column, undefined);
        assert.strictEqual(fragment.end.column, undefined);
    })
    
    it('should supporting dump()', () => {
        assert.deepStrictEqual(fragment.dump(), {
            note: 'Text note',
            color: 2,
            start: {line: 1},
            end: {line: 10}, 
        })
    });

    it('should support clone which creating new object', () => {
        const newFragment = fragment.clone();
        assert.ok(newFragment !== fragment);
        assert.deepStrictEqual(fragment.dump(), newFragment.dump())
    });

    it('can be converted to flat coordinates', () => {
        const collection = new CoverageCollection();
        collection.addItem(fragment)
        // @ts-ignore Test
        collection._freeze();
        assert.strictEqual(fragment.flatStart, 1);
        assert.strictEqual(fragment.flatEnd, 10);
    });

    it('can be converted back to normal coordinates', () => {
        const collection = new CoverageCollection();
        collection.addItem(fragment)
        // @ts-ignore Test
        collection._freeze();
        fragment.flatStart = 2; // shift down on 1 line
        assert.strictEqual(fragment.start.line, 2); // instead 1
    });
});


describe('CoverageCollection', () => {
    let collection: ICoverageCollection;

    function getTestFragment1() {
        return new CoverageFragment({
            start: {line: 1, column: 0},
            end: {line: 2, column: 20},
            color: CoverageColor.GREEN
        });
    }

    function getTestFragment2() {
        return new CoverageFragment({
            start: {line: 2, column: 0},
            end: {line: 4, column: 35},
            color: CoverageColor.GREEN
        });
    }

    beforeEach(() => {
        collection = new CoverageCollection();
    });

    it('should support addItem', () => {
        const fragment = getTestFragment1()
        collection.addItem(fragment)
        assert.strictEqual(collection.items.size, 1)
    });

    it('should support removeItem', () => {
        const fragment = getTestFragment1()
        collection.addItem(fragment)
        collection.removeItem(fragment)
        assert.strictEqual(collection.items.size, 0)
    });

    it('should support dump() method', () => {
        const fragment1 = getTestFragment1()
        const fragment2 = getTestFragment2()
        collection.addItem(fragment1)
        collection.addItem(fragment2)

        assert.strictEqual(collection.dump().length, 2);

        // collection dump meaning dumping each item into array
        assert.deepStrictEqual(collection.dump(), [
            fragment1.dump(),
            fragment2.dump()
        ]);
    });

    it('should support collections merge', () => {
        const fragment1 = getTestFragment1();
        const fragment2 = getTestFragment2();
        const anotherCollection1 = new CoverageCollection();
        const anotherCollection2 = new CoverageCollection();

        anotherCollection1.addItem(fragment1);
        anotherCollection2.addItem(fragment2);

        // We will add two collections to our one
        collection.merge(anotherCollection1);
        collection.merge(anotherCollection2);
        assert.strictEqual(collection.items.size, 2)
    });
});


describe('CoverageCollection with fragments', () => {
    let collection: ICoverageCollection;

    beforeEach(() => {
        collection = new CoverageCollection();
    });

    function getTestFragment1() {
        return new CoverageFragment({
            start: {line: 1, column: 0},
            end: {line: 2, column: 20},
            color: CoverageColor.GREEN
        });
    }

    function getTestFragment2() {
        return new CoverageFragment({
            start: {line: 2, column: 0},
            end: {line: 4, column: 35},
            color: CoverageColor.GREEN
        });
    }

    function getTestFragment3() {
        return new CoverageFragment({
            start: {line: 3, column: 10},
            end: {line: 3, column: 15},
            color: CoverageColor.RED
        });
    }

    it('can union fragments', () => {
        const fragment1 = getTestFragment1();
        const fragment2 = getTestFragment2();
        collection.addItem(fragment1);
        collection.addItem(fragment2);
        collection.normalize();

        // because fragment 1 and 2 could be union to one
        assert.strictEqual(collection.items.size, 1)

        // e.g.
        // fragment1: 1:0 - 2:20 green
        // fragment2: 2:0 - 4:35 green
        // = 1:0 - 4:35
        assert.deepStrictEqual(collection.dump(), [
            {
                start: {line: 1, column: 0},
                end: {line: 4, column: 35},
                color: CoverageColor.GREEN,
                note: undefined
            }
        ]);
    });
    
    it('can split fragments', () => {
        const fragment1 = getTestFragment2();
        const fragment2 = getTestFragment3();
        collection.addItem(fragment1);
        collection.addItem(fragment2);
        collection.normalize();

        // because fragment 2 could be splitted to two
        assert.strictEqual(collection.items.size, 3)

        // e.g
        // fragment1: 2:0 - 4:35 green
        // fragment2: 3:10 - 3:15 red
        // = 2:0 - 3:10 green, 3:10 - 3:15 red, 3:15 - 4:35 green
        assert.deepStrictEqual(collection.dump(), [
            {
                start: {line: 3, column: 10},
                end: {line: 3, column: 15},
                color: CoverageColor.RED,
                note: undefined
            },
            {
                start: {line: 2, column: 0},
                end: {line: 3, column: 9},
                color: CoverageColor.GREEN,
                note: undefined
            },
            {
                start: {line: 3, column: 16},
                end: {line: 4, column: 35},
                color: CoverageColor.GREEN,
                note: undefined
            },
        ])
    });

    // it('should remove when collections have similar regions', () => {
    //     // TODO
    // })
    // it('should remove fragment with zero length', () => {
    //     // TODO
    // });
});


describe('CoverageCollection with flatFragments', () => {
    let collection: ICoverageCollection;

    beforeEach(() => {
        collection = new CoverageCollection();
    });

    function getTestFlatFragment1() {
        return new CoverageFlatFragment({
            start: {line: 1},
            end: {line: 3},
            color: CoverageColor.GREEN
        });
    }

    function getTestFlatFragment2() {
        return new CoverageFlatFragment({
            start: {line: 3},
            end: {line: 10},
            color: CoverageColor.GREEN
        });
    }

    function getTestFlatFragment3() {
        return new CoverageFlatFragment({
            start: {line: 5},
            end: {line: 6},
            color: CoverageColor.RED
        });
    }

    it('can union fragments', () => {
        const fragment1 = getTestFlatFragment1();
        const fragment2 = getTestFlatFragment2();
        collection.addItem(fragment1);
        collection.addItem(fragment2);
        collection.normalize();

        // because fragment 1 and 2 could be union to one
        assert.strictEqual(collection.items.size, 1)

        // e.g.
        // fragment1: 1-3 green
        // fragment2: 3-10 green
        // = 1-10
        assert.deepStrictEqual(collection.dump(), [
            {
                start: {line: 1},
                end: {line: 10},
                color: CoverageColor.GREEN,
                note: undefined
            }
        ]);
    });
    
    it('can split fragments', () => {
        const fragment1 = getTestFlatFragment2();
        const fragment2 = getTestFlatFragment3();
        collection.addItem(fragment1);
        collection.addItem(fragment2);
        collection.normalize();

        // because fragment 2 could be splitted to two
        assert.strictEqual(collection.items.size, 3)

        // e.g
        // fragment1: 3-10 green
        // fragment2: 5-6 red
        // = 3-4 green, 5-6 red, 7-10 green
        assert.deepStrictEqual(collection.dump(), [
            {
                start: {line: 5},
                end: {line: 6},
                color: CoverageColor.RED,
                note: undefined
            },
            {
                start: {line: 3},
                end: {line: 4},
                color: CoverageColor.GREEN,
                note: undefined
            },
            {
                start: {line: 7},
                end: {line: 10},
                color: CoverageColor.GREEN,
                note: undefined
            },
        ])
    });
});

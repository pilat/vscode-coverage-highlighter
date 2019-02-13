import { Summator } from './../src/file1';
import * as assert from 'assert';

describe('calculator/add', () => {
    it('should return a number when parameters are passed to `add()`', () => {
        const sut = new Summator(1, 1);
        assert.ok(sut.calc() === 2);
    });
});

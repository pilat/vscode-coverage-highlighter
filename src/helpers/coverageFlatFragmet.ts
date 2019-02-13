import { ICoverageFragment, CoverageColor } from '../types';
import { CoverageCollection } from './coverageCollection';


export class CoverageFlatFragment {
    /**
     * Fragment will be only with lines, without columnts
     */

    public color: CoverageColor;
    public note: string|undefined;

    public flatStart: number;
    public flatEnd: number;

    private _collection: CoverageCollection|undefined;

    constructor(props: ICoverageFragment) {
        this.flatStart = props.start.line;
        this.flatEnd = props.end.line;
        this.color = props.color;
        this.note = props.note;
    }

    public get length(): number {
        return this.flatStart === this.flatEnd ? 1 : this.flatEnd - this.flatStart;
    }

    public dump(): ICoverageFragment {
        return {
            start: {
                line: this.flatStart
            },
            end: {
                line: this.flatEnd
            },
            color: this.color,
            note: this.note
        };
    }

    public clone() {
        return new CoverageFlatFragment(this.dump()); // "deep" copy
    }

    public isCollisionWith(fragment: CoverageFlatFragment) {
        const isCollision = (fragment.flatStart >= this.flatStart && fragment.flatStart <= this.flatEnd) ||
            (fragment.flatEnd >= this.flatStart && fragment.flatEnd <= this.flatEnd);

        return isCollision;
    }

    public set collection(collection: CoverageCollection) {
        this._collection = collection;
    }

    public get collection(): CoverageCollection|undefined {
        return this._collection;
    }

    public toString(): string {
        return `CoverageFlatFragment (${this.flatStart}-${this.flatEnd}) [${this.color}]`;
    }
}

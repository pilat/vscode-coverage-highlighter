import { CoverageBaseFragment } from './coverageBaseFragment';
import { ICoverageFragmentBase, ICoverageCollection, ICoveragePosition } from './../types';
import { ICoverageFragment, CoverageColor } from '../types';


export class CoverageFlatFragment extends CoverageBaseFragment implements ICoverageFragment {
    /**
     * Fragment will be only with lines, without columnts
     */

    private _color: CoverageColor;
    private _note: string|undefined;

    public flatStart: number;
    public flatEnd: number;

    private _collection: ICoverageCollection|undefined;

    constructor(props: ICoverageFragmentBase) {
        super();
        this.flatStart = props.start.line;
        this.flatEnd = props.end.line;
        this._color = props.color;
        this._note = props.note;
    }

    public get length(): number {
        return this.flatStart === this.flatEnd ? 1 : this.flatEnd - this.flatStart;
    }

    public dump(): ICoverageFragmentBase {
        return {
            start: {
                line: this.flatStart
            },
            end: {
                line: this.flatEnd
            },
            color: this._color,
            note: this._note
        };
    }

    public get start(): ICoveragePosition {
        return {line: this.flatStart}
    }

    public get end(): ICoveragePosition {
        return {line: this.flatEnd}
    }

    public get color(): CoverageColor {
        return this._color;
    }

    public get note(): string|undefined {
        return this._note;
    }

    public set note(value: string|undefined) {
        this._note = value;
    }

    public clone() {
        return new CoverageFlatFragment(this.dump()); // "deep" copy
    }

    public isCollisionWith(fragment: ICoverageFragment) {
        const isCollision = (fragment.flatStart >= this.flatStart && fragment.flatStart <= this.flatEnd) ||
            (fragment.flatEnd >= this.flatStart && fragment.flatEnd <= this.flatEnd);

        return isCollision;
    }

    public set collection(collection: ICoverageCollection) {
        this._collection = collection;
    }

    public get collection(): ICoverageCollection|undefined {
        return this._collection;
    }

    public toString(): string {
        return `CoverageFlatFragment (${this.flatStart}-${this.flatEnd}) [${this._color}]`;
    }
}

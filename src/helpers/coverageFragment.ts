import { ICoverageFragmentBase, ICoverageCollection } from './../types';
import { ICoveragePosition, CoverageColor, ICoverageFragment } from '../types';
import { CoverageBaseFragment } from './coverageBaseFragment';


export class CoverageFragment extends CoverageBaseFragment implements ICoverageFragment {
    /**
     * Fragment with lines and columns
     */

    private _start: ICoveragePosition;
    private _end: ICoveragePosition;
    private _color: CoverageColor;
    private _note: string|undefined;
    private _collection: ICoverageCollection|undefined;

    constructor(props: ICoverageFragmentBase) {
        super();
        this._start = {
            line: props.start.line,
            column: props.start.column
        }
        this._end = {
            line: props.end.line,
            column: props.end.column
        }
        this._color = props.color
        this._note = props.note
        if (this._start.column === undefined || this._end.column === undefined) {
            throw new Error('Only lines with columns are supported')
        }
    }

    public get flatStart(): number {
        return this._start.line * this._getMaxColumns() + this._start.column;
    }

    public get flatEnd(): number {
        return this._end.line * this._getMaxColumns() + this._end.column
    }

    public set flatStart(value: number) {
        const coef = this._getMaxColumns();
        this._start.line = Math.floor(value / coef);
        this._start.column = value % coef
    }

    public set flatEnd(value: number) {
        const coef = this._getMaxColumns() || 1;
        this._end.line = Math.floor(value / coef);
        this._end.column = value % coef
    }

    private _getMaxColumns(): number {
        if (!this.collection || this._collection.maxColumns < 1) {
            throw new Error('Collection is not defined yet')
        }
        return this._collection.maxColumns + 1;
    }

    public get length(): number {
        return this.flatEnd - this.flatStart;
    }

    public dump(): ICoverageFragmentBase {
        return {
            start: {
                line: this._start.line,
                column: this._start.column
            },
            end: {
                line: this._end.line,
                column: this._end.column
            },
            color: this._color,
            note: this._note
        }
    }

    public get start(): ICoveragePosition {
        return this._start;
    }

    public get end(): ICoveragePosition {
        return this._end;
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
        return new CoverageFragment(this.dump()); // "deep" copy
    }

    public isCollisionWith(fragment: ICoverageFragment) {
        const isCollision = (fragment.flatStart >= this.flatStart && fragment.flatStart <= this.flatEnd) || 
            (fragment.flatEnd >= this.flatStart && fragment.flatEnd <= this.flatEnd);
        
        return isCollision;
    }

    public set collection(collection: ICoverageCollection) {
        this._collection = collection;
    }

    public get collection(): ICoverageCollection {
        return this._collection;
    }

    public toString(): string {
        return `CoverageFragment (${this.flatStart}-${this.flatEnd}); (${this._start.line + 1}:${this._start.column} - ${this._end.line + 1}:${this._end.column}) [${this._color}]`
    }
}

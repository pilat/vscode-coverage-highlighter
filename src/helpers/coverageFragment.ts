import { ICoveragePosition, CoverageColor, ICoverageFragment } from '../types';
import { CoverageCollection } from './coverageCollection';


export class CoverageFragment {
    public start: ICoveragePosition;
    public end: ICoveragePosition;
    public color: CoverageColor;
    public note: string|undefined;
    private _collection: CoverageCollection|undefined;

    constructor(props: ICoverageFragment) {
        this.start = {
            line: props.start.line,
            column: props.start.column
        }
        this.end = {
            line: props.end.line,
            column: props.end.column
        }
        this.color = props.color
        this.note = props.note
        if (this.start.column === undefined || this.end.column === undefined) {
            throw new Error('Only lines with columns are supported')
        }
    }

    public get flatStart(): number {
        this._verifyMaxColumns()
        return this.start.line * this._collection.maxColumns + this.start.column;
    }

    public get flatEnd(): number {
        this._verifyMaxColumns()
        return this.end.line * this._collection.maxColumns + this.end.column
    }

    public set flatStart(value: number) {
        this._verifyMaxColumns()
        const coef = this._collection.maxColumns;
        this.start.line = Math.floor(value / coef);
        this.start.column = value % coef
    }

    public set flatEnd(value: number) {
        this._verifyMaxColumns()
        const coef = this._collection.maxColumns || 1;
        this.end.line = Math.floor(value / coef);
        this.end.column = value % coef
    }

    private _verifyMaxColumns() {
        if (!this.collection || this._collection.maxColumns < 1) {
            throw new Error('Collection is not defined yet')
        }
    }

    public get length(): number {
        return this.flatEnd - this.flatStart;
    }

    public dump(): ICoverageFragment {
        return {
            start: {
                line: this.start.line,
                column: this.start.column
            },
            end: {
                line: this.end.line,
                column: this.end.column
            },
            color: this.color,
            note: this.note
        }
    }

    public clone() {
        return new CoverageFragment(this.dump()); // "deep" copy
    }

    public isCollisionWith(fragment: CoverageFragment) {
        const isCollision = (fragment.flatStart >= this.flatStart && fragment.flatStart < this.flatEnd) || 
            (fragment.flatEnd > this.flatStart && fragment.flatEnd <= this.flatEnd);
        
        return isCollision;
    }

    public set collection(collection: CoverageCollection) {
        this._collection = collection;
    }

    public get collection(): CoverageCollection|undefined {
        return this._collection;
    }

    public toString(): string {
        return `CoverageFragment (${this.flatStart}-${this.flatEnd}); (${this.start.line + 1}:${this.start.column} - ${this.end.line + 1}:${this.end.column}) [${this.color}]`
    }
}



export class LanguagesStub {
    public _collection: DiagnosticCollectionStub;

    public createDiagnosticCollection(name: string) {
        this._collection = new DiagnosticCollectionStub(name);
        return this._collection;
    }
}

export class DiagnosticCollectionStub {
    public _items: any[];

    constructor(_name: string) { }

    public set(file: any, ranges: any[]) {
        this._items.push({file, ranges})
    }

    public clear() {
        this._items = [];
    }

    // public get document() {
    //     return this.realEditor.document;
    // }

    // public setDecorations(_color: any, ranges: any[]): string {
    //     if (ranges.length === 0) {
    //         return 'removed';
    //     } else {
    //         return 'added';
    //     }
    // }

    public dispose() {
        // noop
    }
}

import { DisposableStub } from "./disposable.stub";

export class FileSystemWatcherStub {
    public _emitCreate: any;
    public _emitChange: any;
    public _emitDelete: any;

    public onDidCreate (listener: any) {
        this._emitCreate = listener;
        return new DisposableStub();
    }

    public onDidChange (listener: any) {
        this._emitChange = listener;
        return new DisposableStub();
    }

    public onDidDelete (listener: any) {
        this._emitDelete = listener;
        return new DisposableStub();
    }

    public dispose() {
        // noop
    }
}
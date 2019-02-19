export class StatusBarItemStub {
    public text: string;
    public tooltip: string | undefined;
    public color: string | undefined;
    public command: string | undefined;

    public _show: boolean = false;

    public show() {
        this._show = true;
    }

    public hide() {
        this._show = false;
    }

    public dispose() {
        // noop
    }
}

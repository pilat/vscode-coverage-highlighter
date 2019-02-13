export class Example {
    private prop: string;

    constructor() {
        this.prop = 'test';
    }

    public get value(): string {
        return this.prop;
    }

    public getValue(): string {
        return this.prop;
    }
}

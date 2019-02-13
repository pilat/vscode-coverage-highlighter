export class Summator {
    constructor(private a: number, private b: number) { }

    public calc(): number {
        if (this.a === 3) {
            // Not covered fragment
            let _v1 = 1;
        }

        // Not covered branch
        let _v2 = this.a === 1 || this.a === 2;

        return this.a + this.b;
    }

    public someMethod(): number {
        // Not covered function
        let a = 123 + 456;
        return a;
    }
}

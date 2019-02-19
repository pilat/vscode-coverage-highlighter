import { ICoverageFragment } from './../types';


export class CoverageBaseFragment {
    public note: string|undefined;

    public addNoteFrom(fragment: ICoverageFragment) {
        if (fragment.note !== undefined && fragment.note !== this.note) {
            this.note = `${this.note || ''} ${fragment.note || ''}`.trim()
        }
    }
}
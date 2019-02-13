import { Uri, RelativePattern, CancellationToken } from 'vscode';
import { join } from 'path';
import crypto from 'crypto';

import glob, { IOptions } from 'glob';


export function findFiles(pattern: RelativePattern, token: CancellationToken): Promise<Uri[]> {
    /**
     * Standart workspace.findFiles doesn't work with ignored (or git-ignored?) files.
     */
    return new Promise((resolve) => {
        const options: IOptions = {matchBase: true, cwd: pattern.base, dot: true/*, cache: false*/};
        // const glob = globFs({ gitignore: false, debug: true, cache: false, nonull: true });
        glob(pattern.pattern, options, (err: any, files: string[]) => {
            if (token.isCancellationRequested) {
                return;
            }
            if (err) {
                resolve([]);
            } else {
                resolve(files.map(
                    (f) => Uri.file(join(pattern.base, f))));
            }
        });
    });
}

export function randomId(): string {
    return crypto
        .randomBytes(16)
        .toString('hex');
}
// export function sha1(input: string): string {
//     return crypto.createHmac('sha256', 'coverageHightlighter').update(input).digest('hex');
// }

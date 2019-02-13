import { TParser, IParser } from './../types';
import { CoberturaParser } from './coberturaParser';
import { LcovParser } from './lcovParser';
import { IstanbulParser } from './istanbulParser';


export class ParsersCollection {
    public static readonly PARSERS: IParser[] = [CoberturaParser, LcovParser, IstanbulParser];

    public find(ext: string, firstChunk: string): TParser|undefined {
        // apply for each parser
        for (const parser of ParsersCollection.PARSERS) {
            if (parser.testFormat(ext, firstChunk)) {
                return parser;
            }
        }
    }
}

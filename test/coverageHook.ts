import * as fs from "fs";


declare const __coverage__: any;

export function afterTestsHook() {
    const coverageFilename = process.env.COVERAGE_OUTPUT;

    const hasCoverage = typeof __coverage__ !== "undefined";

    if (hasCoverage && coverageFilename) {
        console.log('Coverage data has collected and will be recorded to %s', coverageFilename);
        fs.writeFileSync(coverageFilename, JSON.stringify(__coverage__));
    } else if (hasCoverage) {
        console.warn('Coverage data has collected but COVERAGE_OUTPUT is empty. So, data won\'t be recorded');
    } else {
        console.log('Coverage data not found. Have you ran "nyc instrument"?');
    }
}

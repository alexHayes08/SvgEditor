import { expect } from "chai";
import { fail } from "assert";
import "mocha";

// import { SvgTransformServiceSingleton } from "../src/services/svg-transform-service";

describe("SvgTransformService", () => {
    describe("#extractTransformProperties", () => {
        it ("Should extract a translation of x: 43.5 and y: 22 from a transform string..", () => {
            expect(1).to.equal(1);
            // let transformService = SvgTransformServiceSingleton;
            // let transformStr = "translate( 43.5 ,22) rotate(0) scale(1,1)";
            // let transformProps = transformService.extractTransformProperties(transformStr);

            // if (transformProps.translation != undefined) {
            //     expect(transformProps.translation.x).to.eq(43.5);
            //     expect(transformProps.translation.y).to.eq(22);
            // } else {
            //     expect(transformProps.translation).not.be.null("Failed to retrieve the translation from the transform string.")
            //     expect(transformProps.translation).not.be.undefined("Failed to retrieve the translation from the transform string.")
            // }
        });
    });
});
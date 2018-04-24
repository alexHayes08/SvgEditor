import { expect } from "chai";
import "mocha";

import { toDegrees, toRadians } from "../src/helpers/math-helpers";

describe("math-helper", () => {
    describe("#toDegrees", () => {
        it ("Should convert Math.PI/4 to 45 degrees.", () => {
            let expected = 45;
            let result = toDegrees(Math.PI / 4);

            expect(result).to.equal(expected);
        });
    });

    describe("#toRadians", () => {
        it ("Should convert 90 deg to Math.PI/2.", () => {
            let expected = Math.PI/2;
            let result = toRadians(90);

            expect(result).to.equal(expected);
        });
    });
});
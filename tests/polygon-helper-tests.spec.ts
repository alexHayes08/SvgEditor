import { expect } from "chai";
import "mocha";

import { getCenterOfAdjacentHexagon } from "../src/helpers/polygon-helpers";
import { ICoords2D } from "../src/services/svg-transform-service";
import { roundToSigFig } from "../src/helpers/math-helpers";

describe("polygon-helper", () => {
    describe("#getCenterOfAdjacentHexagon", () => {
        it ("c1{x: 0, y: 0}, x1{x: 1/2, y: sqrt(3)/2}, x2 is clockwise", () => {
            const c1:ICoords2D = {
                x: 0,
                y: 0
            };

            const x1:ICoords2D = {
                x: 1/2,
                y: Math.sqrt(3) / 2
            };

            let c2 = getCenterOfAdjacentHexagon(c1, x1, true);
            
            // c2.x should equal 1.73205
            // c2.y should equal 1
            expect(roundToSigFig(c2.x, 6)).to.equal(1.73205);
            expect(roundToSigFig(c2.y, 6)).to.equal(1);
        });

        it ("c1{x: 5, y: 30}, x1{x: 3, y: 20}, x2 is counter clockwise", () => {
            const c1:ICoords2D = {
                x: 5,
                y: 30
            };

            const x1:ICoords2D = {
                x: 3,
                y: 20
            };

            let c2 = getCenterOfAdjacentHexagon(c1, x1, false);

            // c2.x should equal 11.5359
            // c2.y should equal 10.6795
            expect(roundToSigFig(c2.x, 6)).to.equal(11.5359);
            expect(roundToSigFig(c2.y, 6)).to.equal(10.6795);
        });
    });
});
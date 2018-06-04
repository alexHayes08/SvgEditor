import { expect } from "chai";
import "mocha";

import { ICoords2D } from './../src/services/svg-transform-service';
import { Polygon } from './../src/models/shapes/polygon';

describe("polygon", () => {
    describe("#verticies", () => {
        it ("Should correctly calculate the vertcies of an equilateral triangle.", () => {
            let polygon = new Polygon({
                circumRadius: 1,
                numberOfSides: 3
            });

            expect(polygon.verticies.length).to.equal(3);

            expect(polygon.verticies[0].x.toPrecision(3))
                .to.equal((1).toPrecision(3));
            expect(polygon.verticies[0].y.toPrecision(3))
                .to.equal((0).toPrecision(3));

            expect(polygon.verticies[1].x.toPrecision(3))
                .to.equal((-1/2).toPrecision(3));
            expect(polygon.verticies[1].y.toPrecision(3))
                .to.equal((Math.sqrt(3)/2).toPrecision(3));

            expect(polygon.verticies[2].x.toPrecision(3))
                .to.equal((-1/2).toPrecision(3));
            expect(polygon.verticies[2].y.toPrecision(3))
                .to.equal((-1 * Math.sqrt(3)/2).toPrecision(3));
        });
    });
});
import { expect } from "chai";
import "mocha";

import { calcCenterOfAdjacentHexagon, calcConcentricPolygons, calcCoordsOfPointInPolygon, calcInternalAngle, calcAngleBetweenVerticies } from "../src/helpers/geometry-helpers";
import { ICoords2D } from "../src/services/svg-geometry-service";
import { roundToSigFig } from "../src/helpers/math-helpers";
import { Angle } from "../src/models/angle";

describe("geometry-helpers", () => {
    describe("#calcInternalAngle", () => {
        it ("Expects the internal angle of a triangle to be 60deg.", () => {
            let expectedAngle = 60;
            let calculatedAngle = calcInternalAngle(3).asDegrees();

            expect(calculatedAngle).to.equal(expectedAngle);
        });

        it ("Expects the internal angle of a square to be 90deg.", () => {
            let expectedAngle = 90;
            let calculatedAngle = calcInternalAngle(4).asDegrees();

            expect(calculatedAngle).to.equal(expectedAngle);
        });

        it ("Expects the internal angle of a hexagon to be 120deg.", () => {
            let expectedAngle = 120;
            let calculatedAngle = calcInternalAngle(6).asDegrees();

            expect(calculatedAngle).to.equal(expectedAngle);
        });
    });

    describe("#calcAngleBetweenVerticies", () => {
        it ("Expects the angle between verticies of a triangle to be 120deg.", () => {
            let expectedAngle = 120;
            let calculatedAngle = calcAngleBetweenVerticies(3).asDegrees();

            expect(calculatedAngle).to.equal(expectedAngle);
        });

        it ("Expects the angle between verticies of a square to be 90deg.", () => {
            let expectedAngle = 90;
            let calculatedAngle = calcAngleBetweenVerticies(4).asDegrees();

            expect(calculatedAngle).to.equal(expectedAngle);
        });

        it ("Expects the angle between verticies of a hexagon to be 60deg.", () => {
            let expectedAngle = 60;
            let calculatedAngle = calcAngleBetweenVerticies(6).asDegrees();

            expect(calculatedAngle).to.equal(expectedAngle);
        });
    });
    
    describe("#calcCoordsOfPointInPolygon", () => {
        it ("Should calculate the x0 vertex of a triangle to be at {x:1,y:0}.", () => {
            let point = calcCoordsOfPointInPolygon(3, 0, 1);

            expect(point.x).to.equal(1);
            expect(point.y).to.equal(0);
        });

        it ("Should calculate the x1 vertex of a triangle to be at {x:,y:}.", () => {
            let angle = calcAngleBetweenVerticies(3).asRadians();
            let expectedX = Math.cos(angle);
            let expectedY = Math.sin(angle);
            let point = calcCoordsOfPointInPolygon(3, 1, 1);

            expect(point.x).to.equal(expectedX);
            expect(point.y).to.equal(expectedY);
        });
    });

    describe("#calcConcentricPolygons", () => {
        it ("Should calculate two polygons with a total of x verticies.", () => {
            let polygons = calcConcentricPolygons({
                numberOfVerticies: 32, 
                sideLength: 20,
                minCircumRadius: 60,
                startAngle: Angle.fromDegrees(90)
            });

            let verticies: ICoords2D[] = [];
            polygons.map(p => {
                verticies = verticies.concat(p.verticies);
            });

            // console.log(verticies);
            expect(polygons.length).to.equal(2);
        });
    });

    describe("#calcCenterOfAdjacentHexagon", () => {
        it ("c1{x: 0, y: 0}, x1{x: 1/2, y: sqrt(3)/2}, x2 is clockwise", () => {
            const c1:ICoords2D = {
                x: 0,
                y: 0
            };

            const x1:ICoords2D = {
                x: 1/2,
                y: Math.sqrt(3) / 2
            };

            let c2 = calcCenterOfAdjacentHexagon(c1, x1, true);
            
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

            let c2 = calcCenterOfAdjacentHexagon(c1, x1, false);

            // c2.x should equal 11.5359
            // c2.y should equal 10.6795
            expect(roundToSigFig(c2.x, 6)).to.equal(11.5359);
            expect(roundToSigFig(c2.y, 6)).to.equal(10.6795);
        });
    });
});
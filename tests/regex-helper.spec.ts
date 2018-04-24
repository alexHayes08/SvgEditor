import { expect } from "chai";
import "mocha";

import { getAllGroups } from "../src/helpers/regex-helper";

describe("regex-helper", () => {
    describe("#getAllGroups", function() {
        it ("Test 1: Should find two groups and values should be equal.", () => {
            let expected = [
                [
                    "34",
                    "45"
                ],
                [
                    "34",
                    "45.12"
                ]
            ];
            let str = "translate(    34 , 45 ) rotate(0) scale(1,1) translate(    34 , 45.12 ) rotate(0) scale(1,1)";
            let reg = /translate\(\s*([\d\.]+)\s*,\s*([\d\.]+)\s*\)/g;
        
            let groups = getAllGroups(reg, str);

            expect(groups).to.eql(expected);
        });
    });
});

import { expect } from "chai";
import "mocha";

import { CacheService } from "../src/services/cache-service";

describe("cache-service", () => {
    describe("#size", () => {
        it ("After storing three items, the size should be three.", () => {
            let expected = 3;
            let cache = new CacheService<String, number>();
            cache.set("test a", 42);
            cache.set("test b", 41);
            cache.set("test c", 40);

            // cache.forEach((val, key) => {
            //     console.log(`key: ${key}`);
            //     console.log(`val: ${val}`);
            // });
            expect(cache.size).to.equal(expected);
        });
    });

    describe("#clear", () => {
        it ("Clears out all stored items, size should be zero.", () => {
            let expected = 0;

            let cache = new CacheService<String, number>();
            cache.set("test a", 42);
            cache.set("test b", 41);
            cache.set("test c", 40);
            cache.clear();

            // cache.forEach((val, key) => {
            //     console.log(`key: ${key}`);
            //     console.log(`val: ${val}`);
            // });
            expect(cache.size).to.equal(expected);
        });
    });

    describe("#forEach", () => {
        it ("Iterates over each item.", () => {
            let expectedIterations = 3;
            let actualIterations = 0;
            
            let cache = new CacheService<String, number>();
            cache.set("test a", 42);
            cache.set("test b", 41);
            cache.set("test c", 40);
            cache.forEach(() => actualIterations++);

            expect(actualIterations).to.equal(expectedIterations);
        });
    });

    describe("#get", () => {
        it ("Able to retrieve each stored item by its key.", () => {
            let cache = new CacheService<String, number>();
            let val_0 = 42;
            let val_1 = 43;
            let val_2 = 44;
            cache.set("test a", val_0);
            cache.set("test b",val_1);
            cache.set("test c", val_2);

            expect(cache.get("test a")).to.equal(val_0);
            expect(cache.get("test b")).to.equal(val_1);
            expect(cache.get("test c")).to.equal(val_2);
        });

        it ("Unable to retrieve item after items expiration date.", () => {
            let val_0 = 42;
            let val_1 = 43;
            let val_2 = 44;

            let pastDate = new Date();
            pastDate.setFullYear(pastDate.getFullYear() - 1);
            let futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);

            let cache = new CacheService<String, number>();
            cache.set("test a", val_0, pastDate);
            cache.set("test b",val_1, pastDate);
            cache.set("test c", val_2, futureDate);

            expect(cache.get("test a")).to.equal(undefined);
            expect(cache.get("test b")).to.equal(undefined);
            expect(cache.get("test c")).to.equal(val_2);
        });
    });
});
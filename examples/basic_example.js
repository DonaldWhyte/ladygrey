var ladygrey = require("..");
var sinon = require("sinon");
var Promise = require("es6-promises");

// Promise under test
function getSortedNamesFromDb(db, filter) {
    return new Promise(function(resolve, reject) {
        // nested promise here!
        db.getNames(filter).then(function(names) {
            // Sort returned names and pass to resolution function
            names.sort();
            resolve(names);
        }, reject);
    });
}

describe("Example: listNamesFromUrl", function() {

    it("should return retrieved names in order", function() {
        // EXPECTATIONS:
        var getNamesPromise = new ladygrey.MockPromise()
                                          .resolveWith(["whyte", "donald"]);

        var mockDb = {
            getNames : sinon.stub()
        };
        mockDb.getNames.withArgs("all").returns(getNamesPromise);

        // WHEN:
        var promise = getSortedNamesFromDb(mockDb, "all");

        // THEN:
        return ladygrey.expect(promise)
            .shouldResolveWith(["donald", "whyte"])
            .shouldBeSettled(getNamesPromise)
            .run();
    });

});

/*!
 * ladygrey
 * Copyright(c) 2015 Donald Whyte <donaldwhyte0@gmail.com>
 * MIT Licensed
 */

/*jshint expr: true*/

var Promise = require("es6-promises");

var expect = require("chai").expect;
var ChaiAssertionError = require("chai").AssertionError;

var ladygrey = require("../index");

describe("PromiseExpectation", function() {

    var RESOLVE_PROMISE = new Promise(function(resolve, reject) {
        resolve("some_result");
    });

    var REJECT_PROMISE = new Promise(function(resolve, reject) {
        reject("some_error");
    });

    it("is initialised correctly", function() {
        // WHEN:
        var expectation = ladygrey.expect(RESOLVE_PROMISE);
        // THEN:
        expect(expectation.promise).to.deep.equal(RESOLVE_PROMISE);
        expect(expectation.expectedResult).to.deep.equal(0);
        expect(expectation.expectedArg).to.be.undefined;
        expect(expectation.mocks).to.be.null;
        expect(expectation.promises).to.be.null;
        expect(expectation.finished).to.be.false;
        expect(expectation.callback).to.be.undefined;
    });

    it("fails when promise is resolved instead of rejected", function() {
        // THEN:
        var callback = function(result) {
            expect(result).to.be.an.instanceof(ChaiAssertionError);
            expect(result.message).to.deep.equal(
                "Unexpected resolution of promise with: '\"some_result\"'");
        };

        // WHEN:
        return ladygrey.expect(RESOLVE_PROMISE).shouldReject()
                                               .overrideErrorHandler(callback)
                                               .run();
    });

    it("fails when promise is rejected instead of resolved", function() {
        // THEN:
        var callback = function(result) {
            expect(result).to.be.an.instanceof(ChaiAssertionError);
            expect(result.message).to.deep.equal(
                "Unexpected rejection of promise with: '\"some_error\"'");
        };

        // WHEN:
        return ladygrey.expect(REJECT_PROMISE).shouldResolve()
                                              .overrideErrorHandler(callback)
                                              .run();
    });

    it("fails when wrong arguments are passed to resolve", function() {
        // THEN:
        var callback = function(result) {
            expect(result).to.be.an.instanceof(ChaiAssertionError);
            expect(result.message).to.deep.equal(
                "Unexpected argument passed to promise resolution: " +
                "\"some_result\", expected: \"not_the_result_passed\"");
        };

        // WHEN:
        return ladygrey.expect(RESOLVE_PROMISE)
            .shouldResolveWith("not_the_result_passed")
            .overrideErrorHandler(callback)
            .run();
    });

    it("fails when wrong arguments are passed to reject", function() {
        // THEN:
        var callback = function(result) {
            expect(result).to.be.an.instanceof(ChaiAssertionError);
            expect(result.message).to.deep.equal(
                "Unexpected argument passed to promise rejection: " +
                "\"some_error\", expected: \"not_the_error_passed\"");
        };

        // WHEN:
        return ladygrey.expect(REJECT_PROMISE)
            .shouldRejectWith("not_the_error_passed")
            .overrideErrorHandler(callback)
            .run();
    });

    it("fails when mock verification fails", function() {
        // THEN:
        var callback = function(result) {
            expect(result).to.be.an.instanceof(ChaiAssertionError);
            expect(result.message).to.deep.equal("Mock not called!");
        };

        // GIVEN:
        var mockObject = {
            verify: function() {
                throw new ChaiAssertionError("Mock not called!");
            }
        };

        // WHEN:
        return ladygrey.expect(RESOLVE_PROMISE)
            .shouldResolveWith("some_result")
            .verify(mockObject)
            .overrideErrorHandler(callback)
            .run();
    });

    it("fails when settled promise verification fails", function() {
        // THEN:
        var callback = function(result) {
            expect(result).to.be.an.instanceof(ChaiAssertionError);
            expect(result.message).to.deep.equal(
                "Promise 0 not settled");
        };

        // GIVEN:
        var mockPromiseThatWontBeSettled = new ladygrey.MockPromise();

        // WHEN:
        return ladygrey.expect(RESOLVE_PROMISE)
            .shouldResolveWith("some_result")
            .shouldBeSettled(mockPromiseThatWontBeSettled)
            .overrideErrorHandler(callback)
            .run();
    });

    it("passes when all expectations are met", function() {
        // For this test, we don't need to override Ladygrey's error handler.
        // Instead, we just run a standard ladygrey test that we know should
        // pass, and no error AssertionError is raised then we know Ladygrey
        // thinks all expectations have been yet (which it should).

        // THEN:
        var callback = function(result) {
            expect(result).to.be.an.instanceof(ChaiAssertionError);
            expect(result.message).to.deep.equal(
                "Promise 0 not settled");
        };

        // GIVEN:
        var mockObject = {
            verify: function() {
                // Don't throw exception to indicate mock was called and
                // expectations were verified
            }
        };
        var mockPromiseThatIsSettled = new ladygrey.MockPromise();
        mockPromiseThatIsSettled.settled = true;

        // WHEN:
        return ladygrey.expect(RESOLVE_PROMISE)
            .shouldResolveWith("some_result")
            .verify(mockObject)
            .shouldBeSettled(mockPromiseThatIsSettled)
            .run();
    });

    it("throws exception when invalid expected promise result is specified",
        function() {

        var promiseExpectation = ladygrey.expect(RESOLVE_PROMISE)
                                         .shouldReject();
        promiseExpectation.expectedResult = 999999;

        try {
            promiseExpectation.run();
        } catch (exception) {
            expect(exception).to.be.an.instanceof(ChaiAssertionError);
            expect(exception.message).to.deep.equal(
                "PromiseExpectation has invalid expected result");
        }
    });

    it("throws exception when executed more than once", function() {
        var promiseExpectation = ladygrey.expect(RESOLVE_PROMISE)
                                         .shouldReject();

        var callback = function(result) {
            // Ensure we received the correct error...
            expect(result).to.be.an.instanceof(ChaiAssertionError);
            expect(result.message).to.deep.equal(
                "Unexpected resolution of promise with: '\"some_result\"'");

            // ...and execute expectation again. This should raise a
            // "promise already settled error"
            try {
                promiseExpectation.run();
            } catch (exception) {
                expect(exception).to.be.an.instanceof(ChaiAssertionError);
                expect(exception.message).to.deep.equal(
                    "PromiseExpectation already executed, cannot execute again");
            }
        };

        return promiseExpectation.overrideErrorHandler(callback)
                                 .run();
    });

    it("should not break if undefined passed to promise resolution and no expected argument was set",
        function() {

        // This tests that passing `undefined` to expected resolve/reject callback
        // doesn't break anything if there are no expectations set on the arguments
        // passed to resolution function.

        // GIVEN:
        var undefinedResolvePromise = new Promise(function(resolve, reject) {
            resolve(undefined);
        });
        // WHEN/THEN:
        return ladygrey.expect(undefinedResolvePromise)
            .shouldResolve()
            .run();
    });

    it("should not break if undefined passed to promise resolution and an expected argument was set",
        function() {

        // This tests that passing `undefined` to expected resolve/reject callback
        // doesn't break anything if there are expectations set on the arguments
        // passed to resolution function.

        // THEN:
        var callback = function(result) {
            //console.error(result);
            // Ensure we received the correct error...
            expect(result).to.be.an.instanceof(ChaiAssertionError);
            expect(result.message).to.deep.equal(
                "Unexpected argument passed to promise resolution:" +
                " undefined, expected: null");
        };

        // GIVEN:
        var undefinedResolvePromise = new Promise(function(resolve, reject) {
            resolve(undefined);
        });

        // WHEN:
        return ladygrey.expect(undefinedResolvePromise)
            .shouldResolveWith(null)
            .overrideErrorHandler(callback)
            .run();
    });


});

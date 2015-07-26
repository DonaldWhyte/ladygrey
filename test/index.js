/*!
 * ladygrey
 * Copyright(c) 2015 Donald Whyte <donaldwhyte0@gmail.com>
 * MIT Licensed
 */

/*jshint expr: true*/

var Promise = require("es6-promise").Promise;

var expect = require("chai").expect;
var ChaiAssertionError = require("chai").AssertionError;

var ladygrey = require("../index");

// TODO: null/undefined args with and without having expected args (4 tests)

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
                "Unexpected argument passed to promise resolution: "
                + "\"some_result\", expected: \"not_the_result_passed\"");
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
                "Unexpected argument passed to promise rejection: "
                + "\"some_error\", expected: \"not_the_error_passed\"");
        };

        // WHEN:
        return ladygrey.expect(REJECT_PROMISE)
            .shouldRejectWith("not_the_error_passed")
            .overrideErrorHandler(callback)
            .run();
    });

    it("fails when mock verification fails", function() {
        // TODO
        expect(true).to.be.false;
    });

    it("fails when settled promise verification fails", function() {
        // TODO
        expect(true).to.be.false;
    });

    it("passes when all expectations are met", function() {
        // TODO
        expect(true).to.be.false;
    });

    it("throws exception when invalid expected promise result is specified",
        function() {

        // TODO
        expect(true).to.be.false;
    });

    it("throws exception when executed more than one", function() {
        // TODO
        expect(true).to.be.false;
    });

});

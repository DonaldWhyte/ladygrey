/*!
 * earlgrey
 * Copyright(c) 2015 Donald Whyte <donaldwhyte0@gmail.com>
 * MIT Licensed
 */

/*jshint expr: true*/

(function () {
"use strict";

var expect = require("chai").expect;

//=============================================================================
// * CONSTANTS
//=============================================================================
var RESULT = {
    RESOLVE : 0,
    REJECT : 1
};

//=============================================================================
// * IMPLEMENTATION
//=============================================================================
function throwIfError(obj) {
    if (obj instanceof Error) {
        throw obj;
    }
}

//=============================================================================
// * API
//=============================================================================
// TODO: properly document
function PromiseExpectation(promise) {
    this.promise = promise;
    this.expectedResult = RESULT.RESOLVE; // default
    this.expectedArg = null;
    this.mocks = null;
    this.finished = false;
    return this;
}

PromiseExpectation.prototype.shouldResolve = function() {
    this.shouldResolveWith(null);
    return this;
};

PromiseExpectation.prototype.shouldResolveWith = function(arg) {
    this.expectedResult = RESULT.RESOLVE;
    this.expectedArg = arg;
    return this;
};

PromiseExpectation.prototype.shouldReject = function() {
    this.shouldRejectWith(null);
    return this;
};

PromiseExpectation.prototype.shouldRejectWith = function(arg) {
    this.expectedResult = RESULT.REJECT;
    this.expectedArg = arg;
    return this;
};

PromiseExpectation.prototype.verify = function() {
    // Put all given arguments into `mocks` `Array`, assuming each arg is a
    // mock object
    this.mocks = Array.prototype.slice.call(arguments);
    return this;
};

PromiseExpectation.prototype.shouldBeSettled = function() {
    // Put all given arguments into `promises` `Array`, assuming each arg is a
    // mock promise
    this.promises = Array.prototype.slice.call(arguments);
    return this;
};

PromiseExpectation.prototype.run = function() {
    var _this = this;

    if (_this.finished) {
        throw new Error("PromiseExpectation: expectation already executed" +
                        ", cannot execute again");
    }

    function expectedCallback(arg) {
        throwIfError(arg);

        // Verify given arguments
        if (_this.expectedArg) {
            expect(arg).to.deep.equal(_this.expectedArg);
        }

        // Verify mock expectations
        if (_this.mocks) {
            for (var i = 0; i < _this.mocks.length; i++) {
                _this.mocks[i].verify();
            }
        }

        // Verify promises were settled
        if (_this.promises) {
            for (var j = 0; j < _this.promises.length; j++) {
                expect(_this.promises[j].settled).to.be.true;
            }
        }

        _this.finished = true;
    }

    if (this.expectedResult === RESULT.RESOLVE) {
        return this.promise.then(
            expectedCallback,
            function(error) {
                throwIfError(error);
                var message = "Unexpected rejection of promise with: '" +
                              JSON.stringify(error) + "'";
                throw Error(message);
            }
        );
    } else if (this.expectedResult === RESULT.REJECT) {
        return this.promise.then(
            function(result) {
                throwIfError(result);
                var message = "Unexpected resolution of promise with: '" +
                              JSON.stringify(result) + "'";
                throw Error(message);
            },
            expectedCallback
        );
    } else {
        throw new Error("PromiseExpectation: invalid expected result");
    }
};

function MockPromise() {
    this.result = RESULT.RESOLVE; // default
    this.arg = null;
    this.settled = false;
    return this;
}

MockPromise.prototype.resolveWith = function(arg) {
    this.result = RESULT.RESOLVE;
    this.arg = arg;
    return this;
};

MockPromise.prototype.rejectWith = function(arg) {
    this.result = RESULT.REJECT;
    this.arg = arg;
    return this;
};

MockPromise.prototype.then = function(resolve, reject) {
    if (this.settled) {
        throw new Error("MockPromise: promise already settled, cannot be" +
                        " executed again");
    }

    this.settled = true;
    if (this.result === RESULT.RESOLVE) {
        resolve(this.arg);
    } else if (this.result === RESULT.REJECT) {
        reject(this.arg);
    } else {
        throw new Error("MockPromise: invalid result specified");
    }
};

//=============================================================================
// * EXPORTS
//=============================================================================
module.exports.expect = function(promise) {
    return new PromiseExpectation(promise);
};

module.exports.MockPromise = MockPromise;

}());

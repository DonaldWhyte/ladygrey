/*!
 * ladygrey
 * Copyright(c) 2015 Donald Whyte <donaldwhyte0@gmail.com>
 * MIT Licensed
 */

/*jshint expr: true*/

(function () {
"use strict";

var chai = require("chai");

//=============================================================================
// * PROMISE_RESULT Enumeration
//=============================================================================
var PROMISE_RESULT = {
    RESOLVE : 0,
    REJECT : 1
};

//=============================================================================
// * PromiseExceptation Class
//
// Used to concisely set expectations on whether promises being tested should
// resolve or reject, what's passed to the resolve/reject function and verify
// other expected side-effects after the promise has been executed.
//
// Supported features:
//     * setting expectation on result of promise (resolve or reject)
//     * setting expectations on what's passed to resolve/reject function
//     * verifying `sinon` mocks the promise used (ensuring the verification
//       is executed *after* the promise has finished executing
//     * verifying `ladygrey.MockPromise`s used by promise under test were
//       settled (called)
//     * TODO: callback
//=============================================================================
function PromiseExpectation(promise) {
    this.promise = promise;
    this.expectedResult = PROMISE_RESULT.RESOLVE; // default
    this.expectedArg = undefined;
    this.mocks = null;
    this.promises = null;
    this.finished = false;

    // TODO: comment
    this.errorCallback = undefined;

    return this;
}

PromiseExpectation.prototype.shouldResolve = function() {
    this.shouldResolveWith(undefined);
    return this;
};

PromiseExpectation.prototype.shouldResolveWith = function(arg) {
    this.expectedResult = PROMISE_RESULT.RESOLVE;
    this.expectedArg = arg;
    return this;
};

PromiseExpectation.prototype.shouldReject = function() {
    this.shouldRejectWith(undefined);
    return this;
};

PromiseExpectation.prototype.shouldRejectWith = function(arg) {
    this.expectedResult = PROMISE_RESULT.REJECT;
    this.expectedArg = arg;
    return this;
};

PromiseExpectation.prototype.verify = function() {
    // Put all given arguments into `mocks` `Array`, assuming each arg is a
    // mock object that has a `verify()` function
    this.mocks = Array.prototype.slice.call(arguments);
    return this;
};

PromiseExpectation.prototype.shouldBeSettled = function() {
    // Put all given arguments into `promises` `Array`, assuming each arg is a
    // mock promise that has a `settled` boolean field.
    this.promises = Array.prototype.slice.call(arguments);
    return this;
};

PromiseExpectation.prototype.overrideErrorHandler = function(func) {
    // TODO: explain
    this.errorCallback = func;
    return this;
};

// TODO: comment on why this is here
PromiseExpectation.prototype.throwException = function(ex) {
    if (this.errorCallback) {
        this.errorCallback(ex);
    } else {
        throw ex;
    }
};

PromiseExpectation.prototype.run = function() {
    var _this = this;

    if (_this.finished) {
        throw new Error("PromiseExpectation: expectation already executed" +
                        ", cannot execute again");
    }

    // Callback for expected promise result (resolved or rejected), which;
    // performs further test verifications (e.g. verifying mock expectations,
    // object passed to callback, etc.)
    function expectedCallback(arg) {
        _this.finished = true;

        // Throw object if a Chai assertion error was raised in the promise
        if (arg instanceof chai.AssertionError) {
            _this.throwException(arg);
        }

        var noError = false;
        try {
            // Verify given arguments
            if (_this.expectedArg) {
                if (arg !== _this.expectedArg) {
                    var expectedResultStr =
                        (_this.expectedResult === PROMISE_RESULT.RESOLVE)
                        ? "resolution"
                        : "rejection";

                    var exception = new chai.AssertionError(
                        "Unexpected argument passed to promise "
                        + expectedResultStr
                        + ": " + JSON.stringify(arg)
                        + ", expected: " + JSON.stringify(_this.expectedArg));
                    throw exception;
                }
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
                    chai.expect(_this.promises[j].settled).to.be.true;
                }
            }

            noError = true;
        } catch (exception) {
            if (_this.errorCallback) {
                _this.errorCallback(exception);
            }
        }

        // If there's an error callback set, it means we expect an error.
        // If no error occurred, then raise an assert error and fail the
        // test. This should only really occur in ladygrey's unit tests,
        // where the `errorCallback` property is set
        if (noError && _this.errorCallback) {
            chai.expect("Error not raised as expected").to.deep.equal.false;
            chai.expect(true).to.be.false;
        }
    }

    if (this.expectedResult === PROMISE_RESULT.RESOLVE) {
        return this.promise.then(
            expectedCallback,
            function(error) {
                _this.finished = true;

                var message = "Unexpected rejection of promise with: '" +
                              JSON.stringify(error) + "'";
                var exception = new chai.AssertionError(message);

                _this.throwException(exception);
            }
        );
    } else if (this.expectedResult === PROMISE_RESULT.REJECT) {
        return this.promise.then(
            function(result) {
                _this.finished = true;

                var message = "Unexpected resolution of promise with: '" +
                              JSON.stringify(result) + "'";
                var exception = new chai.AssertionError(message);

                _this.throwException(exception);
            },
            expectedCallback
        );
    } else {
        throw new Error("PromiseExpectation: invalid expected result");
    }
};

//=============================================================================
// * MockPromise Class
//
// Used to test code which uses promises that you wish to mock out. Whether the
// promise is resolved or rejected, and what's passed to the resolve/reject
// can be controlled to test how the user of the mock promise reacts under
// success/failure.
//=============================================================================
function MockPromise() {
    this.result = PROMISE_RESULT.RESOLVE; // default
    this.arg = null;
    this.settled = false;
    return this;
}

MockPromise.prototype.resolveWith = function(arg) {
    this.result = PROMISE_RESULT.RESOLVE;
    this.arg = arg;
    return this;
};

MockPromise.prototype.rejectWith = function(arg) {
    this.result = PROMISE_RESULT.REJECT;
    this.arg = arg;
    return this;
};

MockPromise.prototype.then = function(resolve, reject) {
    if (this.settled) {
        throw new Error("MockPromise: promise already settled, cannot be" +
                        " executed again");
    }

    this.settled = true;
    if (this.result === PROMISE_RESULT.RESOLVE) {
        resolve(this.arg);
    } else if (this.result === PROMISE_RESULT.REJECT) {
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

module.exports.PROMISE_RESULT = PROMISE_RESULT;

}());

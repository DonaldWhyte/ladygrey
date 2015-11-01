# ladygrey

```
npm install ladygrey --save-dev
```

Due to the asynchronous nature of promises, testing them in standard unit tests (e.g. Mocha test cases) can be difficult. This is especially the case when a promise is tested with mock objects. For example, how should the test case know *when* to verify the mock's expectations when it doesn't know exactly when the promise will be resolved?

`ladygrey` defines the `PromiseExpectation` class, which provides a number of promise testing utilities, built on top of [Chai](https://github.com/chaijs/chai), to make testing promises easier.

Example:

```
function foo() {
    return new Promise(function(resolve, reject) {
        resolve(5);
    });
}

describe("foo", function() {
    it("should resolve and return 5", function() {
        var promiseToTest = foo();
        return ladygrey.expect(promiseToTest)
                       .shouldResolveWith(5)
                       .run();
    });
});
```

### Features

`ladygrey.PromiseExpectation` concisely sets expectations on whether promises being tested should resolve or reject, what's passed to the resolve/reject function and verify other expected side-effects after the promise has been executed.

`ladygrey.PromiseExpectation` currently supports the following features:

* setting expectation on result of promise (resolve or reject)
* setting expectations on what's passed to resolve/reject function
* verifying `sinon`-style mocks the promise used (ensuring the verification is executed *after* the promise has finished executing
* verifying `ladygrey.MockPromise`s used by promise under test were settled (called)

`ladygrey.MockPromise` is an additional utility that constructs a promise-like object which resolves/rejects with the arguments you specify, which is useful when testing code that uses nested promises. This is why `ladygrey.PromiseExpectation` supports verification of `MockPromises`s -- it allows promises which call *other* promises to be tested in isolation.

### Tests

Execute ladygrey's unit tests and example tests by running `npm test`.

### Basic Usage Example

See `examples/basic_example.js` for a basic example on how to use ladygrey to test promises. This example also shows how `ladygrey.MockPromise` can be used to create isolated tests when nested promises are used.

### Detailed Usage Guide

TODO: more detailed usage guide with examples here

(function (node) {
    "use strict";

    var main;
    var gabarito;
    var ilk;
    var parts;

    if (node) {
        main = global;
        gabarito = require("gabarito");
        try {
            ilk = require(process.cwd() + "/test/coverage/instrument/lib/ilk");
        } catch (e) {
            ilk = require(process.cwd() + "/lib/ilk");
        }

        parts = require("parts");
    } else {
        main = window;
        gabarito = window.gabarito;
        ilk = window.ilk;
        parts = window.parts;
    }

    var assert = gabarito.assert;

    gabarito.on("complete", function () {
        gabarito.message("grunt-istanbul",
                JSON.stringify(main["__coverage__"]));
    });

    gabarito.test("ilk-test").

    clause("token.toString should return its name", function () {
        var t = new ilk.Token("t");
        assert.areSame(t.toString(), "t");
    }).

    clause("token.valueOf should return its name", function () {
        var t = new ilk.Token("t");
        assert.areSame(t.valueOf(), "t");
    }).

    clause("token.mark should define a property within an object", function () {
        var t = new ilk.Token("t");
        var o = {};
        t.mark(o);
        assert.hop(o, "t");
    }).

    clause("token.mark should define a property a given value", function () {
        var t = new ilk.Token("t");
        var v = {};
        var o = {};
        t.mark(o, v);
        assert.areSame(o.t, v);
    }).

    clause(
    "Token.create should always create a new token with a different name",
    function () {
        var n = 10000;
        var tokens = {};
        for (var i = 0; i < n; i += 1) {
            var token = ilk.Token.create();
            tokens[token.toString()] = token;
        }

        var names = parts.map(tokens, function (v, p) { return p; });
        assert.that(names.length).sameAs(n);
    }).

    clause(
    "Tokens.tokens should invoke the function passing the arguments as new " +
    "tokens",
    function () {
        var f = gabarito.spy(function (t1, t2, t3) {
            assert.that(t1).isInstanceOf(ilk.Token);
            assert.that(t2).isInstanceOf(ilk.Token);
            assert.that(t3).isInstanceOf(ilk.Token);
        });

        ilk.Token.tokens(function (t1, t2, t3) { f(t1, t2, t3); });
        f.verify();
    }).

    clause("ilk should return the function adding a the helpers to it",
    function () {
        var f = function () {};
        assert.areSame(f, ilk(f));

        assert.isFunction(f.descend);
        assert.isFunction(f.constant);
        assert.isFunction(f.proto);
        assert.isFunction(f.shared);
    }).

    clause("ilk should return an empty function if none is given", function () {
        assert.isFunction(ilk());
    }).

    clause("proto should add a new property within the prototype", function () {
        var f = ilk();
        var v = {};

        f.proto("p", v);

        assert.areSame(f.prototype.p, v);
    }).

    clause("proto should add all key/values within the prototype", function () {
        var f = ilk();
        var p = {
            a: {},
            b: {}
        };
        f.proto(p);

        var count = 0;
        parts.forEach(f.prototype, function (v, k) {
            if (k !== "constant") {
                assert.areSame(p[k], v);
            }
            count += 1;
        });

        assert.areSame(count, 3);
    }).

    clause("proto should add a token within the prototype", function () {
        var f = ilk();
        var t = new ilk.Token("t");
        var v = {};
        f.proto(t, v);
        assert.areSame(f.prototype.t, v);
    }).

    clause("constant should add all key/values within the constructor",
    function () {
        var f = ilk();
        var p = {
            a: {},
            b: {}
        };
        f.constant(p);

        var isHelper = function (k) {
            var helperKeys = ["descend", "constant", "proto", "shared",
                "hidden"];

            return parts.indexOf(helperKeys,
                    function (v) { return v === k; }) !== undefined;
        };

        var count = 0;
        parts.forEach(f, function (v, k) {
            if (!isHelper(k)) {
                assert.areSame(p[k], v);
            }
            count += 1;
        });

        assert.areSame(count, 7);
    }).

    clause("constant should add a token within the constructor", function () {
        var f = ilk();
        var t = new ilk.Token("t");
        var v = {};
        f.constant(t, v);
        assert.areSame(f.t, v);
    }).

    clause("constant should resolve to a static property", function () {
        var f = ilk();
        var o = {};
        f.constant("t", o);

        assert.areSame(o, f.constant("t"));
    }).

    clause("constant should resolve to a static property using its token",
    function () {
        var f = ilk();
        var o = {};
        var t = ilk.Token.create();
        f.constant(t, o);

        assert.that(f.constant(t)).sameAs(o);
    }).

    clause(
    "constant should return undefined if no constant can be found within the " +
    "constructor",
    function () {
        var f = ilk();
        assert.that(f.constant("some property")).isUndefined();
    }).

    clause("constant should resolve from an instance to a static property",
    function () {

        var F = ilk();
        var o = {};
        F.constant("t", o);
        var i = new F();

        assert.areSame(o, i.constant("t"));
    }).

    clause(
    "constant should resolve to a static property within the hierarchy chain",
    function () {

        var Foo = ilk();
        var Bar = Foo.descend();
        var o = {};
        Foo.constant("t", o);

        assert.areSame(o, Bar.constant("t"));
    }).

    clause("descend should create a new subclass from a given class",
    function () {
        var Foo = ilk();
        var Bar = Foo.descend();

        var b = new Bar();
        assert.isInstanceOf(b, Foo);
    }).

    clause("descend should use the function as a constructor, " +
            "adding the helpers to it",
    function () {
        var f = function () {};

        var Foo = ilk();
        var Bar = Foo.descend(f);

        assert.areSame(Bar, f);
        assert.isFunction(f.descend);
        assert.isFunction(f.constant);
        assert.isFunction(f.proto);
        assert.isFunction(f.shared);

    }).

    clause(
    "should store the shared tokens object from the constructor and merge " +
            "them to the descendant shared object",
    function () {
        var sharedFoo = { a: {} };
        var Foo = ilk();
        Foo.shared(sharedFoo);

        var sharedBar = {};
        var Bar = Foo.descend(sharedBar);

        assert.areEqual(sharedFoo, sharedBar);
    }).

    clause(
    "bond should create a prototypal inheritance between the constructors",
    function () {
        var Foo = function () {};
        var Bar = function () {};
        ilk.bond(Bar, Foo);
        assert.isInstanceOf(new Bar(), Foo);
    }).

    clause(
    "inherits should create a prototypal inheritance between the " +
    "constructors and add the helpers to the subclass",
    function () {
        var Foo = function () {};
        var Bar = function () {};

        ilk.inherits(Bar, Foo);
        assert.isInstanceOf(new Bar(), Foo);
        assert.isFunction(Bar.descend);
        assert.isFunction(Bar.constant);
        assert.isFunction(Bar.proto);
        assert.isFunction(Bar.shared);
    }).

    clause(
    "ilk.expose should yield an object that has both shared and hidden " +
    "properties within the constructor",
    function () {
        ilk.tokens(function (hiddenToken, sharedToken) {
            var f = ilk().
            shared({
                token: sharedToken
            }).
            hidden({
                token: hiddenToken
            });

            var o = ilk.expose(f);
            assert.that(o).hop("shared");
            assert.that(o).hop("hidden");
            assert.that(o.shared.token).sameAs(sharedToken);
            assert.that(o.hidden.token).sameAs(hiddenToken);
        });

    });


}(typeof exports !== "undefined" && global.exports !== exports));

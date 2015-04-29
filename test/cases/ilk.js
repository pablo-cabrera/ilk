(function (node) {
    "use strict";

    var main;
    var gabarito;
    var ilk;
    var parts;

    if (node) {
        main = global;
        gabarito = require("gabarito");
        ilk = require(process.cwd() + "/lib/ilk");
        parts = require("parts");
    } else {
        main = window;
        gabarito = window.gabarito;
        ilk = window.ilk;
        parts = window.parts;
    }

    var assert = gabarito.assert;

    gabarito.add(parts.make()

    ("name", "ilk-test")

    ("token.toString should return its name", function () {
        var t = new ilk.Token("t");
        assert.areSame(t.toString(), "t");
    })

    ("token.valueOf should return its name", function () {
        var t = new ilk.Token("t");
        assert.areSame(t.valueOf(), "t");
    })

    ("token.mark should define a property within an object", function () {
        var t = new ilk.Token("t");
        var o = {};
        t.mark(o);
        assert.hop(o, "t");
    })

    ("token.mark should define a property a given value", function () {
        var t = new ilk.Token("t");
        var v = {};
        var o = {};
        t.mark(o, v);
        assert.areSame(o.t, v);
    })

    ("ilk should return the function adding a the helpers to it", function () {
        var f = function () {};
        assert.areSame(f, ilk(f));

        assert.isFunction(f.descend);
        assert.isFunction(f.constant);
        assert.isFunction(f.proto);
        assert.isFunction(f.shared);
    })

    ("ilk should return an empty function if none is given", function () {
        assert.isFunction(ilk());
    })

    ("proto should add a new property within the prototype", function () {
        var f = ilk();
        var v = {};

        f.proto("p", v);

        assert.areSame(f.prototype.p, v);
    })

    ("proto should add all key/values within the prototype", function () {
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
    })

    ("proto should add a token within the prototype", function () {
        var f = ilk();
        var t = new ilk.Token("t");
        var v = {};
        f.proto(t, v);
        assert.areSame(f.prototype.t, v);
    })

    ("constant should add all key/values within the constructor", function () {
        var f = ilk();
        var p = {
            a: {},
            b: {}
        };
        f.constant(p);

        var isHelper = function (k) {
            var helperKeys = ["descend", "constant", "proto", "shared"];
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

        assert.areSame(count, 6);
    })

    ("constant should add a token within the constructor", function () {
        var f = ilk();
        var t = new ilk.Token("t");
        var v = {};
        f.constant(t, v);
        assert.areSame(f.t, v);
    })

    ("constant should resolve to a static property", function () {
        var f = ilk();
        var o = {};
        f.constant("t", o);

        assert.areSame(o, f.constant("t"));
    })

    ("constant should resolve from an instance to a static property",
    function () {

        var F = ilk();
        var o = {};
        F.constant("t", o);
        var i = new F();

        assert.areSame(o, i.constant("t"));
    })

    ("constant should resolve to a static property within the hierarchy chain",
    function () {

        var Foo = ilk();
        var Bar = Foo.descend();
        var o = {};
        Foo.constant("t", o);

        assert.areSame(o, Bar.constant("t"));
    })

    ("descend should create a new subclass from a given class", function () {
        var Foo = ilk();
        var Bar = Foo.descend();

        var b = new Bar();
        assert.isInstanceOf(b, Foo);
    })

    ("descend should use the function as a constructor, " +
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

    })

    ("should store the shared tokens object from the constructor and merge " +
            "them to the descendant shared object",
    function () {
        var sharedFoo = { a: {} };
        var Foo = ilk();
        Foo.shared(sharedFoo);

        var sharedBar = {};
        var Bar = Foo.descend(sharedBar);

        assert.areEqual(sharedFoo, sharedBar);
    })


    ("bond should create a prototypal inheritance between the constructors",
    function () {
        var Foo = function () {};
        var Bar = function () {};
        ilk.bond(Bar, Foo);
        assert.isInstanceOf(new Bar(), Foo);
    })

    ("inherits should create a prototypal inheritance between the " +
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
    })

    ("dummy", undefined).build());

}(typeof exports !== "undefined" && global.exports !== exports));

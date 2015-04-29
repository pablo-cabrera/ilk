(function (node) {
    "use strict";
    var main;
    var parts;

    if (node) {
        main = global;
        parts = require("parts");
    } else {
        main = window;
        parts = window.parts;
    }

    var isFunction = parts.isFunction;
    var overload = parts.overload;
    var merge = parts.merge;
    var constant = parts.constant;
    var forEach = parts.forEach;
    var args = parts.args;

    var mark = isFunction(Object.defineProperty) && (function () {
                try {
                    Object.defineProperty({}, "", {});
                    return true;
                } catch (e) {}
                return false;
            }())?
            function (t) { return function (o, v) {
                Object.defineProperty(o, t, {
                    enumerable: false,
                    configurable: true,
                    writable: true,
                    value: v });
            }; }:
            function (t) { return function (o, v) { o[t] = v; }; };

    /**
     * The Token class is used to created private tokens to be used along
     * with the ilk type system.
     *
     * It creates a token with a random name that should be used to mark a
     * given instance with the token's name.
     *
     * It tries to hide the token property from the outside world using the
     * built in defineProperty method. Otherwise it just defines the name
     * as public property anyway.
     *
     * @class ilk.Token
     * @constructor
     *
     * @param {string} token
     */
    var Token = function (token) {

        /**
         * Token's toString
         *
         * @method toString
         * @for ilk.Token
         *
         * @return {string}
         */
        this.toString = constant(token);

        /**
         * Token's valueOf
         *
         * @method valueOf
         * @for ilk.Token
         *
         * @return {string}
         */
        this.valueOf = this.toString;

        /**
         * Defines the token as a property for the given object
         *
         * @method mark
         * @for ilk.Token
         *
         * @param {object} o
         * @param {mixed} [v] Optional value
         */
        this.mark = mark(token);
    };

    merge(Token, {

        /**
         * Creates a new token with a random name
         *
         * @method create
         * @for ilk.Token
         * @static
         *
         * @return {ilk.Token}
         */
        create: (function () {
            var
                chars = "abcdefghijklmnopqrstwxyzABCDEFGHIJKLMNOPQRSTWXYZ",
                length = chars.length,
                lastChar = chars.charAt(chars.length - 1),
                firstChar = chars.charAt(0),
                id = [],
                suffix = [];

            while (suffix.length < 32) {
                suffix.push(chars.charAt(Math.floor(Math.random() * length)));
            }
            suffix = suffix.join("");

            return function () {
                var i, c;
                for (i = id.length - 1; i > -1; i -= 1) {
                    c = id[i];
                    if (c !== lastChar) {
                        id[i] = chars.charAt(chars.indexOf(c) + 1);
                        break;
                    }

                    id[i] = firstChar;
                }

                if (i === -1) {
                    id.unshift(firstChar);
                }

                return new Token(id.join("") + suffix);
            };
        }()),

        /**
         * Passes created tokens to a given function. The number of created
         * tokens are the same of the number of arguments that the function
         * expects.
         *
         * Returns the returned value from the given function.
         *
         * @method tokens
         * @for ilk.Token
         * @static
         *
         * @return {mixed}
         */
        tokens: function (f) {
            var t = [],
                i = f.length;

            while (i !== 0) {
                t.push(Token.create());
                i -= 1;
            }

            return f.apply(this, t);
        }
    });

    var bond = function (constructor, superConstructor) {
        var F = constant();
        F.prototype = superConstructor.prototype;
        constructor.prototype = new F();
        constructor.prototype.constructor = constructor;
        return constructor;
    };

    var inherits = function (constructor, superConstructor) {
        bond(constructor, superConstructor);
        constructor.ancestor = superConstructor.prototype;
        prepare(constructor);
        return constructor;
    };

    /**
     * The pseudo Type class for the ilk type system. This class is
     * used to describe the available methods within the type system itself.
     *
     * Actually there is no Type class, just the added functionality for the
     * classes created with this type system.
     *
     * The type constructor should be called without the new keyword itself,
     * it will receive the constructor function, add some features to it and
     * the return the same reference.
     *
     * The constant method is also assigned to the constructor's prototype.
     * This way it's instances also benefits from the constant method.
     *
     * If the constructor is ommited, an empty constructor is created.
     *
     * @class ilk.Ilk
     * @constructor
     *
     * @param {function} [constructor]
     */
    var define = overload(
        {
            hints: ["object", Token],
            method: function (o, p, v) { p.mark(o, v); }
        },
        {
            hints: ["object", "string"],
            method: function (o, p, v) { o[p] = v; }
        });

    var utils = {

        proto: overload(

            /**
             * Assigns the values from the object to the constructor's
             * prototype instance.
             *
             * @method proto
             * @for ilk.Ilk
             * @static
             * @chainable
             *
             * @param {object} values Various key/value pairs to be assigned
             *              to it's prototype
             *
             * @return {ilk.Ilk} returns the constructor itself
             */
            function (c, values) {
                forEach(values, function (v, p) { c.proto(p, v); });
                return c;
            },

            /**
             * Assigns a simgle value to a specific name to the
             * constructor's prototype instance.
             *
             * @method proto
             * @for ilk.Ilk
             * @static
             * @chainable
             *
             * @param {string|ilk.Token} name
             * @param {mixed} value
             *
             * @return {ilk.Ilk} returns the constructor itself
             */
            function (c, name, value) {
                define(c.prototype, name, value);
                return c;
            }),

        constant: overload(

            /**
             * Resolves a constant value within the constructor itself.
             * If it doens't have the constant directly, it walks up the
             * inheritance tree looking for it.
             *
             * @method constant
             * @for ilk.Ilk
             * @static
             *
             * @param {ilk.Token} name
             *
             * @return {mixed}
             */
            {
                hints: ["function", Token],
                method: function (c, name) {
                    return c.constant(name.toString());
                }
            },

            /**
             * Resolves a constant value within the constructor itself.
             * If it doens't have the constant directly, it walks up the
             * inheritance tree looking for it.
             *
             * @method constant
             * @for ilk.Ilk
             * @static
             *
             * @param {string} name
             *
             * @return {mixed}
             */
            {
                hints: ["function", "string"],
                method: function (c, name) {
                    if (name in c) {
                        return c[name];
                    }

                    if ("ancestor" in c) {
                        return c.ancestor.constructor.constant(name);
                    }
                }
            },

            /**
             * Defines a set of constant within the constructor
             * itself. Uses the values object as key/value pairs to
             * define the constants.
             *
             * @method constant
             * @for ilk.Ilk
             * @static
             * @chainable
             *
             * @param {object} values Various key/value pairs to be assigned
             *              as constants
             *
             * @return {ilk.Ilk} returns the constructor itself
             */
            {
                hints: ["function", "object"],
                method: function (c, values) {
                    forEach(values, function (v, p) { c.constant(p, v); });
                    return c;
                }
            },

            /**
             * Defines a single constant within the constructor.
             *
             * @method constant
             * @for ilk.Ilk
             * @static
             * @chainable
             *
             * @param {string|ilk.Token} name The constant name
             * @param {mixed} value The constant value
             *
             * @return {ilk.Ilk}
             */
            function (c, name, value) {
                define(c, name, value);
                return c;
            })
    };

    var prepare = function (constructor) {
        var tokens;

        constructor.prototype.constant = function (name) {
            return constructor.constant(name);
        };

        /**
         * Stores the shared tokens within the constructor's
         * closure, so whenever a descendant asks for the ancestors
         * tokens, it will receive a copy of them within the merged
         * shared object.
         *
         * @method shared
         * @for ilk.Ilk
         *
         * @param {object} shared
         *
         * @return {ilk.Ilk}
         */
        constructor.shared = function (shared) {
            tokens = shared;
            return constructor;
        };

        constructor.descend = overload(
            /**
             * Creates a new type descendant from this one. It applies
             * the same syntatic sugar as it's parent and does the
             * inherintance linking.
             *
             * @method descend
             * @for ilk.Ilk
             *
             * @param {function} constructor The descendant's constructor
             *
             * @return {ilk.Ilk} The descendant's constructor
             */
            {
                hints: ["function"],
                method: function (descendant) {
                    return constructor.descend(descendant, null);
                }
            },

            /**
             * Creates a new type descendant from this one. It applies
             * the same syntatic sugar as it's parent and does the
             * inherintance linking.
             *
             * A constructor that calls the superclass is
             * created and returned.
             *
             * @method descend
             * @for ilk.Ilk
             *
             * @param {object} shared The descendant's shared tokens
             *
             * @return {ilk.Ilk} The descendant's constructor
             */
            {
                hints: ["object"],
                method: function (shared) {
                    return constructor.descend(null, shared);
                }
            },

            /**
             * Creates a new type descendant from this one. It applies
             * the same syntatic sugar as it's parent and does the
             * inherintance linking.
             *
             * @method descend
             * @for ilk.Ilk
             *
             * @param {function} constructor The descendant's constructor
             * @param {object} shared The descendant's shared tokens
             *
             * @return {ilk.Ilk} The descendant's constructor
             */
            function (descendant, shared) {
                if (!descendant) {
                    descendant = args(function (args) {
                        constructor.apply(this, args);
                    });
                }

                if (tokens && shared) {
                    merge(shared, tokens);
                }

                return inherits(descendant, constructor).
                        shared(shared || tokens);
            });

        forEach(utils, function (f, p) {
            constructor[p] = args(function (args) {
                args.unshift(this);
                return f.apply(this, args);
            });
        });
    };

    var ilk = function (constructor) {
        if (arguments.length === 0) {
            constructor = constant();
        }

        prepare(constructor);
        return constructor;
    };

    merge(ilk, {

        /**
         * Inherit the prototype methods from one constructor into
         * another. The prototype of constructor will be set to a new
         * object created from superConstructor.
         *
         * As an additional convenience, superConstructor.prototype will
         * be accessible through the constructor.ancestor property,
         * along with other facilities within the modl's type sugar.
         *
         * The method returns the constructor reference.
         *
         * @method inherits
         * @for ilk.Ilk
         * @static
         *
         * @param {function} constructor
         * @param {function} superConstructor
         *
         * @return {function}
         */
        inherits: inherits,

        /**
         * Creates the prototype bond between a constructor and its
         * superConstructor, nothing more.
         *
         * @method bond
         * @for ilk.Ilk
         * @static
         *
         * @param {function} constructor
         * @param {function} superConstructor
         *
         * @return {function}
         */
        bond: bond,

        /**
         * Shortcut for
         * {{#crossLink "ilk.Token/tokens:method"}}{{/crossLink}}'s method.
         *
         * @method tokens
         * @for ilk.Ilk
         * @static
         *
         * @param {function} f
         *
         * @return {mixed}
         */
        tokens: function (f) {
            return Token.tokens.call(Token, f);
        },

        Token: Token

    });

    if (node) {
        module.exports = ilk;
    } else {
        main.ilk = ilk;
    }

}(typeof exports !== "undefined" && global.exports !== exports));

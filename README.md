ilk [![Build Status](https://travis-ci.org/pablo-cabrera/ilk.png)](https://travis-ci.org/pablo-cabrera/ilk)
===

A JavaScript type system.

## Index

1. [Tokens](#tokens)
2. [Types](#types)
3. [Inheritance](#inheritance)

This type system tries to implement features that according to what [Alan Kay defines as object oriented programming](http://userpage.fu-berlin.de/~ram/pub/pub_jf47ht81Ht/doc_kay_oop_en). It provides **encapsulation** and **hiding** of state process through ECMAScript's own closure mechanism, and also gives **messaging** through method calls. Along with that, although since we tend to classify things naturally I believe that taxonomy itself is a good thing even by being a bit cumbersome.

### Tokens

To provide encapsulation and hiding of state process, the **ilk** type system uses tokens, that are heavily inspired in the [Symbols proposal for ECMAScript 6](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-symbol-objects). It does so in a way that it saves memory for methods that we need to hide from the outside world, but we don't actually make use of privileged methods. Tokens are types that uses the ECMAScript's [defineProperty](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) (when available) to define its hidden properties. Since it defines properties as non enumerable, its names cannot be discovered through simple object iteration. Also since its internal names are random strings generated at every execution, they might have different values for every execution. By doing so, it prevents users from tampering with the object itself.

Example:

```js
var MyType = (function() {
    var privateProperty = ilk.Token.create();
    var privateMethod = ilk.Token.create();

    var MyType = function() {
        privateProperty.mark(this, "private property value");
    };

    MyType.prototype.foo = function() {
        console.log("foo called");
        this[privateMethod]();
    };

    privateMethod.mark(MyType.prototype, function() {
        console.log("privateMethod called");
        console.log("privateProperty:" + this[privateProperty]);
    });

    return MyType;
}());

var t = new MyType();
t.foo();

```

On the example above, we just created a `MyType` constructor along with a public `foo` method, a private `privateMethod` and `privateProperty` through the use of the `Token` type. The declaration of the property within the instance or the prototype itself is made with the mark method. This method will define the property within using the `defineProperty` and hiding the property name from the outside world. To access the property value itself (either to make a function call or just to read or write its value) we make use of the very same token as property name.

In order to prevent the repetition of various `ilk.Token.create()` to create the needed tokens, the `tokens` method is made available through the `ilk` class. The tokens method will receive a function and will create and pass as many arguments are declared within the function. It calls the function passing all those created tokens and returns the value returned by the inner function itself.

By making use of the tokens method, we could rewrite our type declaration as follows:

```js

var MyType = ilk.tokens(function(privateProperty, privateMethod) {

    var MyType = function() {
        privateProperty.mark(this, "private property value");
    };

    MyType.prototype.foo = function() {
        console.log("foo called");
        this[privateMethod]();
    };

    privateMethod.mark(MyType.prototype, function() {
        console.log("privateMethod called");
        console.log("privateProperty:" + this[privateProperty]);
    });

    return MyType;
});

```

### Types

The type system makes use of ECMAScript's own prototype system. But in order to make class declaration a bit less cumbersome, it provides some sugar in order to save some repetitive keystrokes. These utilities are made available through the `ilk` function.

```js

var MyType = ilk.tokens(function(
    privateProperty,
    privateMethod,
    privateStaticMethod
    PRIVATE_STATIC_PROPERTY
) {

    var MyType = ilk(function() {
        privateProperty.mark(this, "private property value");
    }).

    proto("foo", function() {
        console.log("foo called");
        this[privateMethod]();
    }).

    proto(privateMethod, function() {
        console.log("privateMethod called");
        console.log("privateProperty:" + this[privateProperty]);
        this.constant(privateStaticMethod)();
    }).

    constant(privateStaticMethod, function() {
        console.log("privateStaticMethod called");
        console.log("PRIVATE_STATIC_PROPERTY:" + MyType.constant(PRIVATE_STATIC_PROPERTY));
    }).

    constant(PRIVATE_STATIC_PROPERTY, "PRIVATE STATIC PROPERTY VALUE").

    constant("BAR", "BAR VALUE");

    return MyType;
});

var t = new MyType();

t.foo();
// foo called
// privateMethod called
// privateProperty: private property value
// privateStaticMethod called
// PRIVATE_STATIC_PROPERTY: PRIVATE STATIC PROPERTY VALUE

MyType.BAR; // BAR VALUE
MyType.constant("BAR"); // BAR VALUE
t.constant("BAR"); // BAR VALUE

```

Above there is an usage example of the `ilk` function along with its helper functions to declare and access some of the class's static properties. Upon calling the `ilk` function and passing a constructor function, this very function is returned but before that, the `ilk` function augments the function with these helper functions. Many of these functions are **chainable**, making the declaration of a given class looks a bit more like a single unit.

In the example, we make use of the `proto` method, that is used to augment the constructors prototype. As first argument it may receive the property name, that may be either a plain string (for public properties) or a token (for private properties), the second argument is the value itself that may be a function expression (for methods) or any other value (as attribute).

The `constant` method is also used in the class definition. Its usage is the very same as the `proto` method, it takes the name (string or token) as first parameter and its value as second parameter. But it augments the function instead of its prototype.

Lastly there is the `constant` method which is meant to be used during _runtime_. The `constant` method can be called either by the very constructor (statically) or by any of its instances (dinamically). The `constant` method seeks for properties within the constructor itself, and if there is an class hierarchy, it looks for the property on the hierarchy tree until the root class is reached.

Both the `proto` and the `constant` may also receive an object to declare its properties. The object is used in a dictionary fashion to declare its properties.

```js

var MyType =
    ilk(function() {
        /* constructor code */
    }).

    proto({
        "foo": "foo",
        "bar": function() { console.log("bar!"); }
    }).

    constant({
        "FOO": "FOO",
        "BAR": function() { console.log("BAR!"); }
    });

var t = new MyType();

t.foo; // foo
t.bar(); // bar!
t.FOO; // FOO
t.BAR(); // BAR!

```

### Inheritance

In order to create inheritance between classes, the `ilk` function makes available the `descend` method for every class. The descend method creates a new constructor creating the inheritance between the first class and the created one.

```js

var SuperClass = ilk(function() {
    /* constructor code */
});

var SubClass = SuperClass.descend(function() {
    /* constructor code */
    SuperClass.call(this);
    /* more constructor code */
});

var s = new SubClass();
s instanceof SubClass; // true
s instanceof SuperClass; // true

```

Using the `descend` method, the prototype wiring is made during the `descend` method and a new constructor is created. Note that you still need to make the explicit call to the `SuperClass` constructor in order to apply it to the `SubClass` instance.

To make calls to the super-class methods explicitly, the type system makes available on every constructor function the ancestor's prototype through the property named `ancestor`. With the ancestor's prototype access, we can make use of any methods publicly available to us.

```js

var SuperClass =
    ilk(function() {
        /* constructor code */
    }).

    proto("foo": function() { console.log("super foo!"); });

var SubClass =
    SuperClass.descend(function() {
        /* constructor code */
        SuperClass.call(this);
        /* more constructor code */
    }).

    proto("foo": function() {
        console.log("foo!");
        SubClass.ancestor.foo.call(this);
    });

var s = new SubClass();

s.foo();
// foo!
// super foo!

```

If you have constructor from other libraries and you want to make use of this sugar by extending those constructor without messing with them, you can make use of the `inherits` method. This method creates the inheritance link between constructors and as a bonus, it gives to the subConstructor all the sugar that the `ilk` function gives.

```js

var SomeSuperClass = function () {};

var MySubClass =
    ilk.inherits(function() {
        /* constructor code */
        SomeSuperClass.call(this);
    }, SomeSuperClass).

    proto({
        "foo": "foo",
        "bar": function() { console.log("bar!"); }
    });

var s = new MySubClass();
s instanceof MySubClass; // true
s instanceof SomeSuperClass; // true

```

Now if you just want to make the link between two constructors and don't really want all the goodies from the type system (for whatever reason), there is also the `bond` method. This method will simply create the prototype link between the two functions, nothing more.

```js

var SuperClass = function() {
    /* constructor code */
};

var SubClass = ilk.bond(function() {
    /* constructor code */
    SuperClass.call(this);
    /* more constructor code */
}, SuperClass);

var s = new SubClass();
s instanceof SubClass; // true
s instanceof SuperClass; // true

```

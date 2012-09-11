/*
 * kin
 * https://github.com/pablo-cabrera/kin-js
 *
 * Copyright (c) 2012 Pablo José Cabrera Muñoz
 * Licensed under the MIT license.
 */

(function() {
    
    var descend = function(descendant, kin) {
            var f = function() {};
            f.prototype = kin.prototype;
            descendant.prototype = new f();
            descendant.prototype.constructor = descendant;
            descendant.ancestor = kin.prototype;
        },
        
        create = function(kin, args) {
            var f = function() {
                kin.apply(this, args);
            };
            
            descend(f, kin);
            f.prototype.constructor = kin;
            
            return new f();
        },
    
        /**
         * Creates new classes of things
         * 
         * @param {function}
         *            creator The creator function that will receive the new
         *            blank object as first parameter and the subsequent
         *            arguments from the caller
         * 
         * @return {function} A new kin, or class if you may
         */
        kin = function(creator) {
            
            var constructor = function() {
                var args = Array.prototype.slice.call(arguments);
                if (!(this instanceof constructor)) {
                    return create(constructor, args);
                }
                
                args.unshift(this);
                creator.apply(null, args);
                return this;
            };
            
            constrcutor.prototype.constructor = constructor;
            
            constructor.descend = function(creator) {
                var descendant = kin(creator);
                descend(descendant, constructor);
                return descendant;
            };
            
            return constructor;
        };
        
    exports.kin = kin;
}());
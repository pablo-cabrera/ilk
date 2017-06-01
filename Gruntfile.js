module.exports = function (grunt) {
    "use strict";

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        meta: {
            banner:
                "/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - " +
                "<%= grunt.template.today(\"yyyy-mm-dd\") %>\n" +
                "<%= pkg.homepage ? \"* \" + pkg.homepage + \"\n\": \"\" %>" +
                "* Copyright (c) <%= grunt.template.today(\"yyyy\") %> " +
                        "<%= pkg.author.name %>; " +
                "Licensed " +
                        "<%= _.pluck(pkg.licenses, \"type\").join(\", \") %> */"
        },

        uglify: {
            dist: {
                src: "lib/ilk.js",
                dest: "dist/ilk.js"
            }
        },

        jshint: {
            options: {
                /* enforcing */
                strict: true,
                bitwise: false,
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                noempty: true,
                plusplus: true,
                quotmark: "double",

                undef: true,

                /* relaxing */
                eqnull: true,
                sub: true,

                /* environment */
                globals: {},
                browser: true,
                node: true
            },

            files: ["Gruntfile.js", "lib/ilk.js", "test/cases/ilk.js"]
        },

        jscs: {
            src: ["Gruntfile.js", "lib/ilk.js", "test/cases/ilk.js"],
            options: {
                config: ".jscsrc"
            }
        },

        test: {
            dev: {
                src: [
                    require.resolve("parts"),
                    "lib/ilk.js",
                    "test/cases/ilk.js"
                ]
            }
        },

        yuidoc: {
            compile: {
                name: "<%= pkg.name %>",
                description: "<%= pkg.description %>",
                version: "<%= pkg.version %>",
                url: "<%= pkg.homepage %>",
                options: {
                    paths: "lib/",
                    outdir: "docs/"
                }
            }
        }

    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-yuidoc");
    // grunt.loadNpmTasks("grunt-gabarito");
    grunt.loadNpmTasks("grunt-jscs");

    grunt.registerTask("default", ["jscs", "jshint"/*, "test"*/]);
    grunt.registerTask("dist", ["uglify"]);

};

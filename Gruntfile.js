module.exports = function (grunt) {
    "use strict";

    (function () {
        var task = require("grunt-gabarito");
        var gabarito = require("gabarito");
        task.instance().registerReporter("istanbul", function (reporter) {
            var IstanbulReporter = gabarito.plumbing.Reporter.descend().
            proto({
                message: function (env, msg, coverage) {
                    if (msg !== "grunt-istanbul") {
                        return;
                    }

                    var json = "coverage-" + env.getName() + ".json";

                    grunt.file.write(
                        "test/coverage/reports/" + json,
                        coverage);
                }
            });

            return new IstanbulReporter();
        });
    }());


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

        gabarito: {
            dev: {
                src: [
                    require.resolve("parts"),
                    "lib/ilk.js",
                    "test/cases/ilk.js"
                ],
                options: {
                    environments: ["node", "phantom"]
                }
            },

            coverage: {
                src: [
                    require.resolve("parts"),
                    "test/coverage/instrument/lib/ilk.js",
                    "test/cases/ilk.js"
                ],
                options: {
                    environments: ["node", "phantom"],
                    reporters: ["console", "istanbul"]
                }
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
        },

        instrument: {
            files: "lib/ilk.js",
            options: {
                lazy: true,
                basePath: "test/coverage/instrument/"
            }
        },

        makeReport: {
            src: "test/coverage/reports/**/*.json",
            options: {
                type: "lcov",
                dir: "test/coverage/reports",
                print: "detail"
            }
        },

        clean: {
            coverage: ["test/coverage"]
        }

    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-yuidoc");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-gabarito");
    grunt.loadNpmTasks("grunt-istanbul");
    grunt.loadNpmTasks("grunt-jscs");

    grunt.registerTask("default", ["jscs", "jshint", "gabarito:dev"]);
    grunt.registerTask("dist", ["uglify"]);

    grunt.registerTask("coverage", [
        "clean:coverage",
        "instrument",
        "gabarito:coverage",
        "makeReport"
    ]);

};

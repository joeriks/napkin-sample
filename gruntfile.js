module.exports = function (grunt) {

    grunt.initConfig({
        watch: {
            files: 'sample.txt',
            tasks: ['generate'],
            options: {
                spawn: false,
            }
        },
        peg: {
            napkin: {
                src: "napkin.peg",
                dest: "parser.js"
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-peg');

    var generate = require("./generator");

    grunt.registerTask('generate', function () {

        generate({

            parser: "parser",
            infile: "sample.txt",
            resultout: "sample.json",
            template: "cstemplate.swig",
            out: "sample.cs"

        });

        generate({

            parser: "parser",
            infile: "sample.txt",
            template: "htmltemplate.swig",
            out: "sample.html"

        });

    });
    grunt.registerTask('default', ['peg', 'generate', 'watch']);


};
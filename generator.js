module.exports = function () {

    var grunt = require("grunt");
    var swig = require("swig");

    return function (options) {

        console.log("Start");
        var parser = require("./" + options.parser);
        var infile = grunt.file.read(options.infile);
        console.log("Parsing");
        var parsed = parser.parse(infile);
        var mapped = function () {
            if (options.map) { console.log("Mapping"); return options.map(parsed); }
            return parsed;
        }();

        if (options.resultout) {
            console.log("Writing json");
            grunt.file.write(options.resultout, JSON.stringify(parsed, null, "  "));
        }

        if (options.template) {
            console.log("Generating from template");
            var template = swig.compileFile(options.template);

            var result = template(mapped);
            grunt.file.write(options.out, result);

            console.log("Created " + options.out)
        }

    }

}();
module.exports = function () {

    var grunt = require("grunt");
    var swig = require("swig");

    return function (options) {

        var parser = require("./" + options.parser);
        var infile = grunt.file.read(options.infile);
        var parsed = parser.parse(infile);
        var mapped = function () {
            if (options.map) return options.map(parsed);
            return parsed;
        }();

        var template = swig.compileFile(options.template);

        var result = template(mapped);
        grunt.file.write(options.out, result);

        console.log("Created " + options.out)

    }

}();
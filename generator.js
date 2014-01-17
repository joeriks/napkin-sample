module.exports = function () {

    var grunt = require("grunt");
    var swig = require("swig");

    var generate = function(options) {

        if (typeof (options) == "string") options = { infile: options };

        console.log("Start");

        var parserFile = function () {

            if (options.parser) return options.parser;
            return "parser";

        }();

        if (parserFile.indexOf("./") != 0) parserFile = "./" + parserFile;

        var parser = require(parserFile);
        var infile = grunt.file.read(options.infile);
        console.log("Parsing");
        var parsed = parser.parse(infile);

        // process
        console.log("Processing");
        for (var c in parsed.commands) {

            var cmd = parsed.commands[c];

            if (cmd.type == "include") {

                var filename = cmd.attributes[0].attr;
                console.log("Including " + filename);
                var included = generate({ parser: parserFile, infile: filename });
                //console.log(cmd.attributes.length);
                //if (cmd.attributes.length > 1) {
                //    var atElement = cmd.attributes[1].attr;
                //    parsed.model[atElement] = included;
                //    console.log("at " + atElement);
                //} else {
                parsed.model = included.concat(parsed.model);
                //}                

            }

            if (cmd.type == "map") {

                var filename = cmd.attributes[0].attr;
                console.log("Mapping " + filename);

                var req = require("./" + filename);

                parsed.model = req(parsed.model);

            }

        }

        var processed = parsed.model;

        var mapped = function () {
            if (options.map) { console.log("Mapping"); return options.map(processed); }
            return processed;
        }();

        if (options.resultout) {
            console.log("Writing json");
            grunt.file.write(options.resultout, JSON.stringify(mapped, null, "  "));
        }

        if (options.template) {
            console.log("Generating from template");
            var template = swig.compileFile(options.template);

            var result = template(mapped);
            grunt.file.write(options.out, result);

            console.log("Created " + options.out)
        }

        return mapped;

    }
    return generate;

}();
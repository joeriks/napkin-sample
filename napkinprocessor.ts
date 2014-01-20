var grunt;

var sampleArray = [
    { node: "refs" },
    { node: "two", attributes: [{ "attr": "foo" }, { "attr": "bar" }] },
    { node: "three", attributes: [{ "attr": "baz" }] },
    {
        node: "four",
        children: [
            { node: "=.two" },
            { node: "=.three" },
            { node: "4three" },
            { node: "4four" }
        ]
    }
];

var processArray = function (fullarray, childarray, position, iteratorCallback) {

    var localposition = 0;
    for (var i in childarray) {
        var itm = childarray[i];

        var position2 = function () {
            var copy = position.slice();
            copy.push(localposition);
            return copy;
        } ();

        iteratorCallback(fullarray, position2, itm);

        if (itm.children) {

            processArray(fullarray, itm.children, position2, iteratorCallback);

        }
        localposition++;
    }
}

var findChild = function (array, findChildName, callback) {

    var find = function (name:string) {

        var firstDot = name.indexOf(".");
        if (firstDot == -1) {
            return { head: name, tail: "" }
        };
        return { head: name.substring(0, firstDot), tail: name.substring(firstDot + 1) };

            } (findChildName);

    var found = false;
    for (var i in array) {

        if (array[i].node == find.head) {
            if (find.tail != "") {
                if (array[i].children)
                    findChild(array[i].children, find.tail, callback)
                } else {
                callback(array[i]);
            }
        }
    }

};

var findIterator = function (fullarray, findAt, findChildName, callback) {

    return function (fullarray, position, itm) {
        if (position.join(",") === findAt.join(",")) {

            if (findChildName == "") callback(fullarray, itm);

            else 
            
                findChild(itm.children, findChildName, function (founditm) {

                    callback(fullarray, founditm);

                });


        }

    }

};

var iterate = function (fullarray, position, itm) {

    if (itm.node.substring(0, 1) == "=") {

        var count = 0;

        var findAt = position.slice();
        for (var i in itm.node.substring(1)) {
            
            if (itm.node.substring(i + 1, i + 2) == ".")
            {
                count++;
                findAt.pop();
            }
            else
                break;
        }

        var childName = itm.node.substring(count + 2);


        if (count > 0) {

            var fi = findIterator(fullarray, findAt, childName, (foundItem) => {

                if (foundItem.children) itm.children = foundItem.children;
                if (foundItem.attributes) itm.attributes = foundItem.attributes;

                

            });

            
            processArray(fullarray, fullarray, [], fi);
        }


    }

}

    var processAll = function (array) { processArray(array, array, [], iterate) };

var generate = function (options) {

    if (typeof (options) == "string") options = { infile: options };

    console.log("Start");

    var parserFile = function () {

        if (options.parser) return options.parser;
        return "parser";

    } ();

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
    } ();

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


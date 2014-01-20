var fs = require("fs");
var napkinparser = require("./napkinparser");

console.log("v 0.044");

function repeat(pattern, count) {
    if (count < 1)
        return '';
    var result = '';
    while (count > 0) {
        if (count & 1)
            result += pattern;
        count >>= 1, pattern += pattern;
    }
    return result;
}

function genericprocessor(pre, hasChildren, post) {
    var buffer = "";
    var write = function (text) {
        buffer += text;
    };

    var pr = function (nodeOrNodes, level) {
        var tabs = repeat("\t", level);

        var node = {};

        if (typeof level == "undefined") {
            node.children = nodeOrNodes;
            node.isRoot = true;
            node.node = "{root}";
            level = -1;
        } else {
            node = nodeOrNodes;
        }

        if (!node.isRoot)
            pre({ level: level, node: node, tabs: tabs, write: write });

        //console.log(tabs + "<node name=\"" + node.node + "\">");
        if (typeof hasChildren == "undefined" || hasChildren == null)
            hasChildren = function () {
                return (node.children);
            };

        if (hasChildren({ level: level, node: node, tabs: tabs, write: write })) {
            for (var i in node.children) {
                pr(node.children[i], level + 1);
            }
        }

        if (!node.isRoot && typeof post != "undefined")
            post({ level: level, node: node, tabs: tabs, write: write });
    };

    return function (nodes) {
        buffer = "";
        pr(nodes);
        return buffer;
    };
}

var generateTags = genericprocessor(function (pr) {
    var atts = [];
    if (pr.node.attributes) {
        for (var i in pr.node.attributes) {
            var attr = pr.node.attributes[i];
            var key = Object.keys(attr)[0];
            var value = attr[key];
            atts.push(key + "=" + "\"" + value + "\"");
        }
    }
    var attrs = "";
    if (atts.length > 0)
        attrs = " " + atts.join(" ");

    pr.write(pr.tabs + "<node name=\"" + pr.node.node + "\"" + attrs + ">\n");
}, null, function (pr) {
    pr.write(pr.tabs + "</node>\n");
});

var generateText = genericprocessor(function (pr) {
    function stringIfNeeded(s) {
        if (s.indexOf(" ") != -1 || s.indexOf("\n") != -1) {
            return "\"" + s + "\"";
        }
        return s;
    }

    var atts = [];
    if (pr.node.attributes) {
        for (var i in pr.node.attributes) {
            var attr = pr.node.attributes[i];
            var key = Object.keys(attr)[0];
            var value = stringIfNeeded(attr[key]);

            if (key == "attr")
                atts.push(value);
            else
                atts.push(key + "=" + value + "");
        }
    }

    var attrs = "";
    if (atts.length > 0)
        attrs = " " + atts.join(" ");

    pr.write(pr.tabs + stringIfNeeded(pr.node.node) + attrs + "\n");
}, null, function (pr) {
});

var generateCs = genericprocessor(function (pr) {
    var atts = [];
    if (pr.node.attributes) {
        for (var i in pr.node.attributes) {
            var attr = pr.node.attributes[i];
            var key = Object.keys(attr)[0];
            var value = attr[key];

            if (key == "attr")
                atts.push(value);
            else
                atts.push(key + "=" + value);
        }
    }

    var attrs = "";
    if (atts.length > 0)
        attrs = " " + atts.join(" ");

    if (pr.level == 0) {
        if (pr.node.node.indexOf("_") != 0)
            pr.write(pr.tabs + "namespace " + pr.node.node + " {\n");
    }

    if (pr.level == 1) {
        if (pr.node.node.indexOf("_") != 0)
            pr.write(pr.tabs + "public class " + pr.node.node + " {\n");
    }

    if (pr.level == 2) {
        var type = "string";
        if (atts.length > 0) {
            type = atts[0];
            if (atts[0] == "i")
                type = "int";
        }

        if (pr.node.children) {
            for (var ch in pr.node.children) {
                pr.write(pr.tabs + "[Description(\"" + pr.node.children[ch].node + "\")]\n");
            }
        }

        pr.write(pr.tabs + "public " + type + " " + pr.node.node + " {get;set;}\n");
    }
}, function (pr) {
    if ((pr.node.children) && pr.node.node.indexOf("_") != 0)
        return true;
    return false;
}, function (pr) {
    if (pr.level == 0 || pr.level == 1) {
        if (pr.node.node.indexOf("_") != 0)
            pr.write(pr.tabs + "}\n");
    }
});

function processAll(array) {
    processArray(array, array, null, [], processIteratedItem);
}

function processArray(fullarray, childarray, parentNode, position, iteratorCallback) {
    if (parentNode)
        console.log(parentNode.node);

    var localposition = 0;
    for (var i in childarray) {
        var currentNode = childarray[i];

        var position2 = function () {
            var copy = position.slice(0);
            copy.push(localposition);
            return copy;
        }();

        iteratorCallback(fullarray, position2, currentNode, parentNode);

        if (currentNode.children) {
            currentNode.children = processArray(fullarray, currentNode.children, currentNode, position2, iteratorCallback);
        }

        localposition++;
    }

    var newChildArray = [];
    for (var ii in childarray) {
        if (childarray[ii]["replaceWithChildren"]) {
            for (var iii in childarray[ii].children) {
                newChildArray.push(childarray[ii].children[iii]);
            }
        } else {
            newChildArray.push(childarray[ii]);
        }
    }

    childarray = newChildArray;
    return newChildArray;
}
function splitHeadTail(name, char) {
    var firstDot = name.indexOf(char);

    if (firstDot == -1) {
        return { head: name, tail: "" };
    }
    ;
    return { head: name.substring(0, firstDot), tail: name.substring(firstDot + 1) };
}
function findChild(array, findChildName, callback) {
    var find = splitHeadTail(findChildName, ".");

    var found = false;

    for (var i in array) {
        //console.log("looking at " + array[i].node + " for " + find.head);
        var lookAtNode = array[i];
        if (lookAtNode.node == find.head) {
            console.log("Found head " + find.head + " now looking for " + ((find.tail) ? find.tail : "attributes"));
            if (find.tail != "") {
                //console.log("found, continuing");
                var children = lookAtNode.children;
                if (children)
                    if (find.tail != "_") {
                        findChild(children, find.tail, callback);
                    } else {
                        console.log("Include all children");
                        for (var ii in children) {
                            var child = children[ii];
                            callback(children[ii], true);
                        }
                    }
            } else {
                //console.log("found");
                //console.log(array[i]);
                callback(lookAtNode, false);
            }
        }
    }
}
;

function createFindIterator(fullarray, findAt, findChildName, callback) {
    return function (fullarray, position, itm) {
        var pos = position.join(",");
        var find = findAt.join(",");

        var found = (pos === find);

        console.log("looking at " + pos + " for " + find + " and name " + findChildName);

        if (position.length == 1 && find == "") {
            // top level search
            var headTail = splitHeadTail(findChildName, ".");

            console.log("same level lookup for " + headTail.head);
            console.log("checking " + itm.node);

            if (itm.node == headTail.head && headTail.tail == "_") {
                for (var i in itm.children) {
                    callback(fullarray, itm.children[i], true);
                }
            }
            if (itm.node == headTail.head && headTail.tail == "") {
                // add as child
                callback(fullarray, itm, true);
            }

            if (itm.node == headTail.head && headTail.tail != "" && headTail.tail != "") {
                found = true;
                findChildName = headTail.tail;
            }
            //    if (itm.node == headTail.head) {
            //        found = true;
            //        findChildName = headTail.tail;
            //    }
            //    if (headTail.tail = "_") {
            //        found = true;
            //        findChildName = "_";
            //    }
        }

        if (found) {
            console.log("found parent " + itm.node + ((findChildName) ? " now looking for " + findChildName : ""));

            if (findChildName == "") {
                callback(fullarray, itm, false);
            } else {
                console.log("Calling find child");
            }

            findChild(itm.children, findChildName, function (founditm, addAsChild) {
                console.log("Add as child" + addAsChild);
                callback(fullarray, founditm, addAsChild);
            });
        }
    };
}
;

function processIteratedItem(fullarray, position, itemToProcess, parentNode) {
    // process iterated item
    if (itemToProcess.node.substring(0, 1) == "=") {
        // command found at iterated item
        console.log("processing " + itemToProcess.node);

        var count = 0;

        var findAt = position.slice(0);
        findAt.pop();

        var param = itemToProcess.node.substring(1);
        for (var i = 0; i < param.length; i++) {
            if (param.substring(i, i + 1) == ".") {
                count++;
                findAt.pop();
            } else
                break;
        }

        var childName = param.substring(count);

        if (count > 0) {
            console.log("find " + findAt.join(",") + " " + childName);

            var foundCallback = function (array, foundItem, addAsChild) {
                console.log(foundItem);
                if (addAsChild) {
                    console.log("Adding found node as child");
                    itemToProcess["replaceWithChildren"] = true;

                    if (!(itemToProcess.children)) {
                        console.log("Adding children element");
                        itemToProcess.children = [];
                    }

                    itemToProcess.children.push(foundItem);
                } else {
                    itemToProcess.node = foundItem.node;
                    console.log("Setting children and attributes from found node");
                    if (foundItem.children) {
                        if (!(itemToProcess.children)) {
                            console.log("Adding children element");
                            itemToProcess.children = [];
                        }
                        itemToProcess.children = itemToProcess.children.concat(foundItem.children);
                    }
                    if (foundItem.attributes) {
                        if (!(itemToProcess.attributes)) {
                            console.log("Adding attributes element");
                            itemToProcess.attributes = [];
                        }
                        itemToProcess.attributes = itemToProcess.attributes.concat(foundItem.attributes);
                    }
                }

                itemToProcess["processed"] = param;
            };

            var findIterator = createFindIterator(fullarray, findAt, childName, foundCallback);

            //console.log("find referenced node");
            console.log("Now iterating");

            processArray(fullarray, fullarray, itemToProcess, [], findIterator);
        }
    }
}

function generate(param) {
    var options;

    if (typeof param == "string")
        options = { infile: param };
    else
        options = param;

    //var parserFile = (options.parser) ? options.parser : "parser";
    //if (parserFile.indexOf("./") != 0) parserFile = "./" + parserFile;
    //var parser = require(parserFile);
    var infile = (options.infile);
    console.log("Parsing");

    var fileAsString = fs.readFileSync(infile, "utf8").replace(/^\uFEFF/, '');

    var parser = napkinparser;
    var parsed = parser.parse(fileAsString);

    console.log("Infile length: " + fileAsString.length);
    console.log("Parsed to length: " + JSON.stringify(parsed).length);

    // process
    if (parsed.commands) {
        console.log("Processing " + parsed.commands.length + " commands");
        var commands = parsed.commands.splice(0);
        console.log(commands);

        for (var c in commands) {
            var cmd = commands[c];

            console.log("Running command " + cmd.type);

            if (cmd.type == "include" || cmd.type == "reference") {
                var filename = cmd.attributes[0].attr;
                console.log("Including " + filename);

                var included = generate(filename);

                console.log("Concating");

                if (included) {
                    console.log("array " + included);
                    var arr = [];
                    for (var i = 0; i < included.length; i++) {
                        var item = included[i];
                        console.log(item);

                        item["included"] = cmd.type;

                        console.log(item);
                        arr.push(item);
                    }

                    console.log(included);

                    parsed.model = arr.concat(parsed.model);
                    //if (cmd.type == "include") {
                    //} else {
                    //    if (!(parsed["references"])) parsed["references"] = [];
                    //    parsed.references = parsed.references.concat(included);
                    //}
                } else
                    console.log("Empty");
            }

            if (cmd.type == "map") {
                var filename = cmd.attributes[0].attr;
                console.log("Mapping " + filename);
                var req = require("./" + filename);
                parsed.model = req(parsed.model);
            }

            if (cmd.type == "processall") {
                processAll(parsed.model);
            }

            if (cmd.type == "out") {
                if (cmd.attributes && cmd.attributes.length > 1) {
                    var filename = cmd.attributes[0].attr;
                    var type = cmd.attributes[1].attr;

                    console.log("Creating " + type + " format");

                    if (!parsed.processed) {
                        console.log("Processing");
                        parsed.processed = parsed.model.slice(0);
                        processAll(parsed.processed);

                        // remove referenced
                        var newChildArray = [];
                        for (var ii in parsed.processed) {
                            console.log(parsed.processed[ii]);
                            if (!(parsed.processed[ii]["included"] && parsed.processed[ii]["included"] == "reference")) {
                                newChildArray.push(parsed.processed[ii]);
                            }
                        }

                        parsed.processed = newChildArray;
                    }

                    if (type == "text") {
                        var formatted = generateText(parsed.processed);
                        fs.writeFileSync(filename, formatted);
                        console.log("Created " + filename);
                    }
                    if (type == "xml") {
                        var formatted = generateTags([{ node: "root", children: parsed.processed }]);
                        fs.writeFileSync(filename, formatted);
                        console.log("Created " + filename);
                    }
                    if (type == "json") {
                        fs.writeFileSync(filename, JSON.stringify(parsed.processed, null, "  "));
                        console.log("Created " + filename);
                    }
                    if (type == "cs") {
                        var formatted = generateCs(parsed.processed);
                        fs.writeFileSync(filename, formatted);
                        console.log("Created " + filename);
                    }
                    if (type == "jsonraw") {
                        fs.writeFileSync(filename, JSON.stringify(parsed, null, "  "));
                        console.log("Created " + filename);
                    }
                }
            }
        }

        console.log("Finished " + options.infile);
        return parsed.model;
    }
}

//var mapped = (options.mapfn) ? options.mapfn(processed) : processed;
//if (options.resultout) {
//    console.log("Writing json");
//    fs.writeFileSync(options.resultout, JSON.stringify(mapped, null, "  "));
//}
//if (options.template) {
//    console.log("Generating from template");
//    var template = swig.compileFile(options.template);
//    var result = template(mapped);
//    fs.writeFileSync(options.out, result);
//    console.log("Created " + options.out);
//}
module.exports = {
    generate: generate,
    parser: napkinparser,
    asTags: generateTags,
    asText: generateText
};

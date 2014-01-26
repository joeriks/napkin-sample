console.log("v 0.061");

var fs = require("fs");
var path = require("path");
var napkinparser = require("./napkinparser_simplified");
var traverse = require("traverse");

function processAll(array) {
    processArray(array, array, null, [], processIteratedItem);
}

function processArray(fullarray, childarray, parentNode, position, iteratorCallback) {
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

function findChild(array, findChildName, callback) {
    var find = splitHeadTail(findChildName, ".");

    var found = false;

    for (var i in array) {
        var lookAtNode = array[i];
        if (lookAtNode.name == find.head) {
            if (find.tail != "") {
                var children = lookAtNode.children;
                if (children)
                    if (find.tail != "_") {
                        findChild(children, find.tail, callback);
                    } else {
                        for (var ii in children) {
                            var child = children[ii];
                            callback(children[ii], true);
                        }
                    }
            } else {
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

        if (position.length == 1 && find == "") {
            var headTail = splitHeadTail(findChildName, ".");

            if (itm.node == headTail.head && headTail.tail == "_") {
                for (var i in itm.children) {
                    callback(fullarray, itm.children[i], true);
                }
            }
            if (itm.node == headTail.head && headTail.tail == "") {
                callback(fullarray, itm, true);
            }

            if (itm.node == headTail.head && headTail.tail != "" && headTail.tail != "") {
                found = true;
                findChildName = headTail.tail;
            }
        }

        if (found) {
            if (findChildName == "") {
                callback(fullarray, itm, false);
            } else {
            }

            findChild(itm.children, findChildName, function (founditm, addAsChild) {
                callback(fullarray, founditm, addAsChild);
            });
        }
    };
}
;

function processIteratedItem(fullarray, position, itemToProcess, parentNode) {
    if (itemToProcess.name.substring(0, 1) == "=") {
        var count = 0;

        var findAt = position.slice(0);
        findAt.pop();

        var param = itemToProcess.name.substring(1);
        for (var i = 0; i < param.length; i++) {
            if (param.substring(i, i + 1) == ".") {
                count++;
                findAt.pop();
            } else
                break;
        }

        var childName = param.substring(count);

        if (count > 0) {
            var foundCallback = function (array, foundItem, addAsChild) {
                if (addAsChild) {
                    itemToProcess["replaceWithChildren"] = true;

                    if (!(itemToProcess.children)) {
                        itemToProcess.children = [];
                    }

                    itemToProcess.children.push(foundItem);
                } else {
                    itemToProcess.name = foundItem.name;

                    if (foundItem.children) {
                        if (!(itemToProcess.children)) {
                            itemToProcess.children = [];
                        }
                        itemToProcess.children = itemToProcess.children.concat(foundItem.children);
                    }
                    if (foundItem.attributes) {
                        if (!(itemToProcess.attributes)) {
                            itemToProcess.attributes = [];
                        }
                        itemToProcess.attributes = itemToProcess.attributes.concat(foundItem.attributes);
                    }
                }

                itemToProcess["processed"] = param;
            };

            var findIterator = createFindIterator(fullarray, findAt, childName, foundCallback);

            processArray(fullarray, fullarray, itemToProcess, [], findIterator);
        }
    }
}

function splitHeadTail(name, char) {
    var firstDot = name.indexOf(char);

    if (firstDot == -1) {
        return { head: name, tail: "" };
    }
    ;
    return { head: name.substring(0, firstDot), tail: name.substring(firstDot + 1) };
}

function generate(objectToParse, type) {
    for (var g in exports.generators) {
        var generator = exports.generators[g];

        if (generator.type == type) {
            return generator.generatorFunction(objectToParse);
        }
    }

    console.log("Generator not found " + type + " did you miss to install it (i.e. require('napkin-generator-" + type + "')?");

    return JSON.stringify(objectToParse, null, "  ");
}
exports.generate = generate;

function runCommands(objectToParse) {
    function cmd_include(filename, type) {
        var included = exports.parseFile(filename, false);

        if (included) {
            var arr = [];
            for (var i = 0; i < included.length; i++) {
                var item = included[i];

                item["included"] = type;

                arr.push(item);
            }

            objectToParse.document = arr.concat(objectToParse.document);
        }
    }

    function cmd_map(filename) {
        var req = require("./" + filename);
        objectToParse = req(objectToParse);
    }

    function cmd_out(filename, type) {
        if (typeof type == "undefined" || type == null) {
            type = path.extname(filename);
            if (type.indexOf(".") == 0)
                type = type.substring(1);
            else
                type = "text";
        }

        if (!objectToParse.processed) {
            objectToParse.processed = objectToParse.document.slice(0);

            var newChildArray = [];
            for (var ii in objectToParse.processed) {
                var node = objectToParse.processed[ii];
                if (!(node["included"] && node["included"] == "reference")) {
                    newChildArray.push(objectToParse.processed[ii]);
                } else {
                    console.log("excluded " + node.name);
                }
            }

            objectToParse.processed = newChildArray;
        }

        var formatted = exports.generate(objectToParse.processed, type);

        fs.writeFileSync(filename, formatted);
    }

    traverse(objectToParse.document).forEach(function on_item(item) {
        if (item.name) {
            if (item.name.indexOf("/") == 0) {
                item.isCommand = true;

                if (item.name == "/out") {
                    cmd_out(item.attributes[0], item.attributes[1] || null);
                }
            }
        }
    });

    return objectToParse;
}

function parseString(textToParse, doRunCommands) {
    if (typeof doRunCommands == "undefined")
        doRunCommands = true;

    var parsed = napkinparser.parse(textToParse);

    if (doRunCommands)
        runCommands(parsed);

    return parsed.document;
}
exports.parseString = parseString;

function parseFile(filename, doRunCommands) {
    if (typeof doRunCommands == "undefined")
        doRunCommands = true;

    var textToParse = fs.readFileSync(filename, "utf8").replace(/^\uFEFF/, '');

    return exports.parseString(textToParse, doRunCommands);
}
exports.parseFile = parseFile;

exports.generators = [];

function addGenerator(type, generatorFunction) {
    exports.generators.push({ type: type, generatorFunction: generatorFunction });

    console.log("Added generator for Napkin: " + type);
}
exports.addGenerator = addGenerator;

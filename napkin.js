var fs = require("fs");

console.log("v 0.043");

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

    pr.write(pr.tabs + pr.node.node + attrs + "\n");
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

    var parser = createPegJsNapkinParser();
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
var pegJsNapkinParser = createPegJsNapkinParser();
function createPegJsNapkinParser() {
    function peg$subclass(child, parent) {
        function ctor() {
            this.constructor = child;
        }
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
    }

    function SyntaxError(message, expected, found, offset, line, column) {
        this.message = message;
        this.expected = expected;
        this.found = found;
        this.offset = offset;
        this.line = line;
        this.column = column;

        this.name = "SyntaxError";
    }

    peg$subclass(SyntaxError, Error);

    function parse(input) {
        var options = arguments.length > 1 ? arguments[1] : {}, peg$FAILED = {}, peg$startRuleFunctions = { start: peg$parsestart }, peg$startRuleFunction = peg$parsestart, peg$c0 = peg$FAILED, peg$c1 = [], peg$c2 = null, peg$c3 = function (cmd) {
            return cmd;
        }, peg$c4 = function (ns) {
            return ns;
        }, peg$c5 = function (cmds, ns) {
            return { commands: cmds, model: ns };
        }, peg$c6 = "/", peg$c7 = { type: "literal", value: "/", description: "\"/\"" }, peg$c8 = function (cmd, attributes) {
            return { type: cmd.trim(), attributes: attributes };
        }, peg$c9 = /^[a-zA-Z.]/, peg$c10 = { type: "class", value: "[a-zA-Z.]", description: "[a-zA-Z.]" }, peg$c11 = " ", peg$c12 = { type: "literal", value: " ", description: "\" \"" }, peg$c13 = function (c) {
            return c.join("");
        }, peg$c14 = { type: "other", description: "whitespace" }, peg$c15 = void 0, peg$c16 = function (nodeHead, attributes) {
            if (attributes.length > 0)
                return { node: nodeHead, attributes: attributes };
            return { node: nodeHead };
        }, peg$c17 = function (c) {
            return c;
        }, peg$c18 = function (node, children) {
            if (children)
                node["children"] = children;
            return node;
        }, peg$c19 = function (attr) {
            return { attr: attr };
        }, peg$c20 = "=", peg$c21 = { type: "literal", value: "=", description: "\"=\"" }, peg$c22 = function (name, attr) {
            var o = {};
            o[name] = attr;
            return o;
        }, peg$c23 = /^[a-zA-Z0-9_]/, peg$c24 = { type: "class", value: "[a-zA-Z0-9_]", description: "[a-zA-Z0-9_]" }, peg$c25 = /^[=#]/, peg$c26 = { type: "class", value: "[=#]", description: "[=#]" }, peg$c27 = /^[.a-zA-Z0-9_]/, peg$c28 = { type: "class", value: "[.a-zA-Z0-9_]", description: "[.a-zA-Z0-9_]" }, peg$c29 = function (i, c) {
            return i + c.join("");
        }, peg$c30 = { type: "other", description: "string" }, peg$c31 = "\"", peg$c32 = { type: "literal", value: "\"", description: "\"\\\"\"" }, peg$c33 = "'", peg$c34 = { type: "literal", value: "'", description: "\"'\"" }, peg$c35 = function (parts) {
            return parts[1];
        }, peg$c36 = function (chars) {
            return chars.join("");
        }, peg$c37 = "\\", peg$c38 = { type: "literal", value: "\\", description: "\"\\\\\"" }, peg$c39 = { type: "any", description: "any character" }, peg$c40 = function (char_) {
            return char_;
        }, peg$c41 = /^[\n\r\u2028\u2029]/, peg$c42 = { type: "class", value: "[\\n\\r\\u2028\\u2029]", description: "[\\n\\r\\u2028\\u2029]" }, peg$c43 = "/*", peg$c44 = { type: "literal", value: "/*", description: "\"/*\"" }, peg$c45 = "*/", peg$c46 = { type: "literal", value: "*/", description: "\"*/\"" }, peg$c47 = /^[ \t]/, peg$c48 = { type: "class", value: "[ \\t]", description: "[ \\t]" }, peg$c49 = "\r\n", peg$c50 = { type: "literal", value: "\r\n", description: "\"\\r\\n\"" }, peg$c51 = "\n", peg$c52 = { type: "literal", value: "\n", description: "\"\\n\"" }, peg$c53 = "\r", peg$c54 = { type: "literal", value: "\r", description: "\"\\r\"" }, peg$c55 = function (i) {
            return i.join("") === indent;
        }, peg$c56 = function (i) {
            return i.length > indent.length;
        }, peg$c57 = function (i) {
            indentStack.push(indent);
            indent = i.join("");
            var pos = offset;
        }, peg$c58 = function (i) {
            indentStack.push(indent);
            indent = i.join("");
            peg$currPos = offset();
        }, peg$c59 = function () {
            indent = indentStack.pop();
        }, peg$currPos = 0, peg$reportedPos = 0, peg$cachedPos = 0, peg$cachedPosDetails = { line: 1, column: 1, seenCR: false }, peg$maxFailPos = 0, peg$maxFailExpected = [], peg$silentFails = 0, peg$result;

        if ("startRule" in options) {
            if (!(options.startRule in peg$startRuleFunctions)) {
                throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
            }

            peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
        }

        function text() {
            return input.substring(peg$reportedPos, peg$currPos);
        }

        function offset() {
            return peg$reportedPos;
        }

        function line() {
            return peg$computePosDetails(peg$reportedPos).line;
        }

        function column() {
            return peg$computePosDetails(peg$reportedPos).column;
        }

        function expected(description) {
            throw peg$buildException(null, [{ type: "other", description: description }], peg$reportedPos);
        }

        function error(message) {
            throw peg$buildException(message, null, peg$reportedPos);
        }

        function peg$computePosDetails(pos) {
            function advance(details, startPos, endPos) {
                var p, ch;

                for (p = startPos; p < endPos; p++) {
                    ch = input.charAt(p);
                    if (ch === "\n") {
                        if (!details.seenCR) {
                            details.line++;
                        }
                        details.column = 1;
                        details.seenCR = false;
                    } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
                        details.line++;
                        details.column = 1;
                        details.seenCR = true;
                    } else {
                        details.column++;
                        details.seenCR = false;
                    }
                }
            }

            if (peg$cachedPos !== pos) {
                if (peg$cachedPos > pos) {
                    peg$cachedPos = 0;
                    peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
                }
                advance(peg$cachedPosDetails, peg$cachedPos, pos);
                peg$cachedPos = pos;
            }

            return peg$cachedPosDetails;
        }

        function peg$fail(expected) {
            if (peg$currPos < peg$maxFailPos) {
                return;
            }

            if (peg$currPos > peg$maxFailPos) {
                peg$maxFailPos = peg$currPos;
                peg$maxFailExpected = [];
            }

            peg$maxFailExpected.push(expected);
        }

        function peg$buildException(message, expected, pos) {
            function cleanupExpected(expected) {
                var i = 1;

                expected.sort(function (a, b) {
                    if (a.description < b.description) {
                        return -1;
                    } else if (a.description > b.description) {
                        return 1;
                    } else {
                        return 0;
                    }
                });

                while (i < expected.length) {
                    if (expected[i - 1] === expected[i]) {
                        expected.splice(i, 1);
                    } else {
                        i++;
                    }
                }
            }

            function buildMessage(expected, found) {
                function stringEscape(s) {
                    function hex(ch) {
                        return ch.charCodeAt(0).toString(16).toUpperCase();
                    }

                    return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\x08/g, '\\b').replace(/\t/g, '\\t').replace(/\n/g, '\\n').replace(/\f/g, '\\f').replace(/\r/g, '\\r').replace(/[\x00-\x07\x0B\x0E\x0F]/g, function (ch) {
                        return '\\x0' + hex(ch);
                    }).replace(/[\x10-\x1F\x80-\xFF]/g, function (ch) {
                        return '\\x' + hex(ch);
                    }).replace(/[\u0180-\u0FFF]/g, function (ch) {
                        return '\\u0' + hex(ch);
                    }).replace(/[\u1080-\uFFFF]/g, function (ch) {
                        return '\\u' + hex(ch);
                    });
                }

                var expectedDescs = new Array(expected.length), expectedDesc, foundDesc, i;

                for (i = 0; i < expected.length; i++) {
                    expectedDescs[i] = expected[i].description;
                }

                expectedDesc = expected.length > 1 ? expectedDescs.slice(0, -1).join(", ") + " or " + expectedDescs[expected.length - 1] : expectedDescs[0];

                foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

                return "Expected " + expectedDesc + " but " + foundDesc + " found.";
            }

            var posDetails = peg$computePosDetails(pos), found = pos < input.length ? input.charAt(pos) : null;

            if (expected !== null) {
                cleanupExpected(expected);
            }

            return new SyntaxError(message !== null ? message : buildMessage(expected, found), expected, found, pos, posDetails.line, posDetails.column);
        }

        function peg$parsestart() {
            var s0, s1, s2, s3, s4, s5, s6;

            s0 = peg$currPos;
            s1 = [];
            s2 = peg$currPos;
            s3 = peg$parse__();
            if (s3 !== peg$FAILED) {
                s4 = peg$parseCMD();
                if (s4 !== peg$FAILED) {
                    s5 = peg$parse__();
                    if (s5 !== peg$FAILED) {
                        s6 = peg$parseEOL();
                        if (s6 === peg$FAILED) {
                            s6 = peg$c2;
                        }
                        if (s6 !== peg$FAILED) {
                            peg$reportedPos = s2;
                            s3 = peg$c3(s4);
                            s2 = s3;
                        } else {
                            peg$currPos = s2;
                            s2 = peg$c0;
                        }
                    } else {
                        peg$currPos = s2;
                        s2 = peg$c0;
                    }
                } else {
                    peg$currPos = s2;
                    s2 = peg$c0;
                }
            } else {
                peg$currPos = s2;
                s2 = peg$c0;
            }
            while (s2 !== peg$FAILED) {
                s1.push(s2);
                s2 = peg$currPos;
                s3 = peg$parse__();
                if (s3 !== peg$FAILED) {
                    s4 = peg$parseCMD();
                    if (s4 !== peg$FAILED) {
                        s5 = peg$parse__();
                        if (s5 !== peg$FAILED) {
                            s6 = peg$parseEOL();
                            if (s6 === peg$FAILED) {
                                s6 = peg$c2;
                            }
                            if (s6 !== peg$FAILED) {
                                peg$reportedPos = s2;
                                s3 = peg$c3(s4);
                                s2 = s3;
                            } else {
                                peg$currPos = s2;
                                s2 = peg$c0;
                            }
                        } else {
                            peg$currPos = s2;
                            s2 = peg$c0;
                        }
                    } else {
                        peg$currPos = s2;
                        s2 = peg$c0;
                    }
                } else {
                    peg$currPos = s2;
                    s2 = peg$c0;
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = [];
                s3 = peg$currPos;
                s4 = peg$parse__();
                if (s4 !== peg$FAILED) {
                    s5 = peg$parseNODE();
                    if (s5 !== peg$FAILED) {
                        s6 = peg$parse__();
                        if (s6 !== peg$FAILED) {
                            peg$reportedPos = s3;
                            s4 = peg$c4(s5);
                            s3 = s4;
                        } else {
                            peg$currPos = s3;
                            s3 = peg$c0;
                        }
                    } else {
                        peg$currPos = s3;
                        s3 = peg$c0;
                    }
                } else {
                    peg$currPos = s3;
                    s3 = peg$c0;
                }
                if (s3 !== peg$FAILED) {
                    while (s3 !== peg$FAILED) {
                        s2.push(s3);
                        s3 = peg$currPos;
                        s4 = peg$parse__();
                        if (s4 !== peg$FAILED) {
                            s5 = peg$parseNODE();
                            if (s5 !== peg$FAILED) {
                                s6 = peg$parse__();
                                if (s6 !== peg$FAILED) {
                                    peg$reportedPos = s3;
                                    s4 = peg$c4(s5);
                                    s3 = s4;
                                } else {
                                    peg$currPos = s3;
                                    s3 = peg$c0;
                                }
                            } else {
                                peg$currPos = s3;
                                s3 = peg$c0;
                            }
                        } else {
                            peg$currPos = s3;
                            s3 = peg$c0;
                        }
                    }
                } else {
                    s2 = peg$c0;
                }
                if (s2 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c5(s1, s2);
                    s0 = s1;
                } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$c0;
            }

            return s0;
        }

        function peg$parseCMD() {
            var s0, s1, s2, s3, s4, s5, s6;

            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 47) {
                s1 = peg$c6;
                peg$currPos++;
            } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c7);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parseLiteral();
                if (s2 !== peg$FAILED) {
                    s3 = peg$parseWS();
                    if (s3 !== peg$FAILED) {
                        s4 = [];
                        s5 = peg$parseNAMEDATTRIBUTE();
                        if (s5 === peg$FAILED) {
                            s5 = peg$parseATTRIBUTE();
                        }
                        while (s5 !== peg$FAILED) {
                            s4.push(s5);
                            s5 = peg$parseNAMEDATTRIBUTE();
                            if (s5 === peg$FAILED) {
                                s5 = peg$parseATTRIBUTE();
                            }
                        }
                        if (s4 !== peg$FAILED) {
                            s5 = [];
                            s6 = peg$parseEOL();
                            if (s6 !== peg$FAILED) {
                                while (s6 !== peg$FAILED) {
                                    s5.push(s6);
                                    s6 = peg$parseEOL();
                                }
                            } else {
                                s5 = peg$c0;
                            }
                            if (s5 !== peg$FAILED) {
                                peg$reportedPos = s0;
                                s1 = peg$c8(s2, s4);
                                s0 = s1;
                            } else {
                                peg$currPos = s0;
                                s0 = peg$c0;
                            }
                        } else {
                            peg$currPos = s0;
                            s0 = peg$c0;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$c0;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$c0;
            }

            return s0;
        }

        function peg$parseNODEHEAD() {
            var s0, s1, s2, s3;

            s0 = peg$currPos;
            s1 = [];
            if (peg$c9.test(input.charAt(peg$currPos))) {
                s2 = input.charAt(peg$currPos);
                peg$currPos++;
            } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c10);
                }
            }
            if (s2 !== peg$FAILED) {
                while (s2 !== peg$FAILED) {
                    s1.push(s2);
                    if (peg$c9.test(input.charAt(peg$currPos))) {
                        s2 = input.charAt(peg$currPos);
                        peg$currPos++;
                    } else {
                        s2 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c10);
                        }
                    }
                }
            } else {
                s1 = peg$c0;
            }
            if (s1 !== peg$FAILED) {
                s2 = [];
                if (input.charCodeAt(peg$currPos) === 32) {
                    s3 = peg$c11;
                    peg$currPos++;
                } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c12);
                    }
                }
                while (s3 !== peg$FAILED) {
                    s2.push(s3);
                    if (input.charCodeAt(peg$currPos) === 32) {
                        s3 = peg$c11;
                        peg$currPos++;
                    } else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c12);
                        }
                    }
                }
                if (s2 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c13(s1);
                    s0 = s1;
                } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$c0;
            }

            return s0;
        }

        function peg$parseWS() {
            var s0, s1;

            peg$silentFails++;
            s0 = [];
            if (input.charCodeAt(peg$currPos) === 32) {
                s1 = peg$c11;
                peg$currPos++;
            } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c12);
                }
            }
            while (s1 !== peg$FAILED) {
                s0.push(s1);
                if (input.charCodeAt(peg$currPos) === 32) {
                    s1 = peg$c11;
                    peg$currPos++;
                } else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c12);
                    }
                }
            }
            if (s0 === peg$FAILED) {
                s0 = peg$parseEOL();
            }
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c14);
                }
            }

            return s0;
        }

        function peg$parseNODE() {
            var s0, s1, s2, s3, s4, s5, s6, s7, s8;

            s0 = peg$currPos;
            s1 = peg$parseSAMEDENT();
            if (s1 !== peg$FAILED) {
                s2 = peg$currPos;
                s3 = peg$currPos;
                peg$silentFails++;
                s4 = peg$parseEOL();
                peg$silentFails--;
                if (s4 === peg$FAILED) {
                    s3 = peg$c15;
                } else {
                    peg$currPos = s3;
                    s3 = peg$c0;
                }
                if (s3 !== peg$FAILED) {
                    s4 = peg$parseLiteralOrStringOrCode();
                    if (s4 !== peg$FAILED) {
                        s5 = [];
                        if (input.charCodeAt(peg$currPos) === 32) {
                            s6 = peg$c11;
                            peg$currPos++;
                        } else {
                            s6 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c12);
                            }
                        }
                        while (s6 !== peg$FAILED) {
                            s5.push(s6);
                            if (input.charCodeAt(peg$currPos) === 32) {
                                s6 = peg$c11;
                                peg$currPos++;
                            } else {
                                s6 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c12);
                                }
                            }
                        }
                        if (s5 !== peg$FAILED) {
                            s6 = [];
                            s7 = peg$parseNAMEDATTRIBUTE();
                            if (s7 === peg$FAILED) {
                                s7 = peg$parseATTRIBUTE();
                            }
                            while (s7 !== peg$FAILED) {
                                s6.push(s7);
                                s7 = peg$parseNAMEDATTRIBUTE();
                                if (s7 === peg$FAILED) {
                                    s7 = peg$parseATTRIBUTE();
                                }
                            }
                            if (s6 !== peg$FAILED) {
                                peg$reportedPos = s2;
                                s3 = peg$c16(s4, s6);
                                s2 = s3;
                            } else {
                                peg$currPos = s2;
                                s2 = peg$c0;
                            }
                        } else {
                            peg$currPos = s2;
                            s2 = peg$c0;
                        }
                    } else {
                        peg$currPos = s2;
                        s2 = peg$c0;
                    }
                } else {
                    peg$currPos = s2;
                    s2 = peg$c0;
                }
                if (s2 !== peg$FAILED) {
                    s3 = peg$parse__();
                    if (s3 !== peg$FAILED) {
                        s4 = peg$currPos;
                        s5 = peg$parseINDENT();
                        if (s5 !== peg$FAILED) {
                            s6 = [];
                            s7 = peg$parseNODE();
                            while (s7 !== peg$FAILED) {
                                s6.push(s7);
                                s7 = peg$parseNODE();
                            }
                            if (s6 !== peg$FAILED) {
                                s7 = peg$parse__();
                                if (s7 !== peg$FAILED) {
                                    s8 = peg$parseDEDENT();
                                    if (s8 !== peg$FAILED) {
                                        peg$reportedPos = s4;
                                        s5 = peg$c17(s6);
                                        s4 = s5;
                                    } else {
                                        peg$currPos = s4;
                                        s4 = peg$c0;
                                    }
                                } else {
                                    peg$currPos = s4;
                                    s4 = peg$c0;
                                }
                            } else {
                                peg$currPos = s4;
                                s4 = peg$c0;
                            }
                        } else {
                            peg$currPos = s4;
                            s4 = peg$c0;
                        }
                        if (s4 === peg$FAILED) {
                            s4 = peg$c2;
                        }
                        if (s4 !== peg$FAILED) {
                            peg$reportedPos = s0;
                            s1 = peg$c18(s2, s4);
                            s0 = s1;
                        } else {
                            peg$currPos = s0;
                            s0 = peg$c0;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$c0;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$c0;
            }

            return s0;
        }

        function peg$parseATTRIBUTE() {
            var s0, s1, s2, s3;

            s0 = peg$currPos;
            s1 = peg$parseLiteralOrStringOrCode();
            if (s1 !== peg$FAILED) {
                s2 = [];
                if (input.charCodeAt(peg$currPos) === 32) {
                    s3 = peg$c11;
                    peg$currPos++;
                } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c12);
                    }
                }
                while (s3 !== peg$FAILED) {
                    s2.push(s3);
                    if (input.charCodeAt(peg$currPos) === 32) {
                        s3 = peg$c11;
                        peg$currPos++;
                    } else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c12);
                        }
                    }
                }
                if (s2 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c19(s1);
                    s0 = s1;
                } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$c0;
            }

            return s0;
        }

        function peg$parseNAMEDATTRIBUTE() {
            var s0, s1, s2, s3, s4, s5;

            s0 = peg$currPos;
            s1 = peg$parseLiteralOrStringOrCode();
            if (s1 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 61) {
                    s2 = peg$c20;
                    peg$currPos++;
                } else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c21);
                    }
                }
                if (s2 !== peg$FAILED) {
                    s3 = peg$parseLiteralOrStringOrCode();
                    if (s3 !== peg$FAILED) {
                        s4 = [];
                        if (input.charCodeAt(peg$currPos) === 32) {
                            s5 = peg$c11;
                            peg$currPos++;
                        } else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c12);
                            }
                        }
                        while (s5 !== peg$FAILED) {
                            s4.push(s5);
                            if (input.charCodeAt(peg$currPos) === 32) {
                                s5 = peg$c11;
                                peg$currPos++;
                            } else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c12);
                                }
                            }
                        }
                        if (s4 !== peg$FAILED) {
                            peg$reportedPos = s0;
                            s1 = peg$c22(s1, s3);
                            s0 = s1;
                        } else {
                            peg$currPos = s0;
                            s0 = peg$c0;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$c0;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$c0;
            }

            return s0;
        }

        function peg$parseLiteral() {
            var s0, s1, s2;

            s0 = peg$currPos;
            s1 = [];
            if (peg$c23.test(input.charAt(peg$currPos))) {
                s2 = input.charAt(peg$currPos);
                peg$currPos++;
            } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c24);
                }
            }
            if (s2 !== peg$FAILED) {
                while (s2 !== peg$FAILED) {
                    s1.push(s2);
                    if (peg$c23.test(input.charAt(peg$currPos))) {
                        s2 = input.charAt(peg$currPos);
                        peg$currPos++;
                    } else {
                        s2 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c24);
                        }
                    }
                }
            } else {
                s1 = peg$c0;
            }
            if (s1 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c13(s1);
            }
            s0 = s1;

            return s0;
        }

        function peg$parseCode() {
            var s0, s1, s2, s3;

            s0 = peg$currPos;
            if (peg$c25.test(input.charAt(peg$currPos))) {
                s1 = input.charAt(peg$currPos);
                peg$currPos++;
            } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c26);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = [];
                if (peg$c27.test(input.charAt(peg$currPos))) {
                    s3 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c28);
                    }
                }
                if (s3 !== peg$FAILED) {
                    while (s3 !== peg$FAILED) {
                        s2.push(s3);
                        if (peg$c27.test(input.charAt(peg$currPos))) {
                            s3 = input.charAt(peg$currPos);
                            peg$currPos++;
                        } else {
                            s3 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c28);
                            }
                        }
                    }
                } else {
                    s2 = peg$c0;
                }
                if (s2 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c29(s1, s2);
                    s0 = s1;
                } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$c0;
            }

            return s0;
        }

        function peg$parseLiteralOrStringOrCode() {
            var s0;

            s0 = peg$parseLiteral();
            if (s0 === peg$FAILED) {
                s0 = peg$parseStringLiteral();
                if (s0 === peg$FAILED) {
                    s0 = peg$parseCode();
                }
            }

            return s0;
        }

        function peg$parseStringLiteral() {
            var s0, s1, s2, s3, s4;

            peg$silentFails++;
            s0 = peg$currPos;
            s1 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 34) {
                s2 = peg$c31;
                peg$currPos++;
            } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c32);
                }
            }
            if (s2 !== peg$FAILED) {
                s3 = peg$parseDoubleStringCharacters();
                if (s3 === peg$FAILED) {
                    s3 = peg$c2;
                }
                if (s3 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 34) {
                        s4 = peg$c31;
                        peg$currPos++;
                    } else {
                        s4 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c32);
                        }
                    }
                    if (s4 !== peg$FAILED) {
                        s2 = [s2, s3, s4];
                        s1 = s2;
                    } else {
                        peg$currPos = s1;
                        s1 = peg$c0;
                    }
                } else {
                    peg$currPos = s1;
                    s1 = peg$c0;
                }
            } else {
                peg$currPos = s1;
                s1 = peg$c0;
            }
            if (s1 === peg$FAILED) {
                s1 = peg$currPos;
                if (input.charCodeAt(peg$currPos) === 39) {
                    s2 = peg$c33;
                    peg$currPos++;
                } else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c34);
                    }
                }
                if (s2 !== peg$FAILED) {
                    s3 = peg$parseSingleStringCharacters();
                    if (s3 === peg$FAILED) {
                        s3 = peg$c2;
                    }
                    if (s3 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 39) {
                            s4 = peg$c33;
                            peg$currPos++;
                        } else {
                            s4 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c34);
                            }
                        }
                        if (s4 !== peg$FAILED) {
                            s2 = [s2, s3, s4];
                            s1 = s2;
                        } else {
                            peg$currPos = s1;
                            s1 = peg$c0;
                        }
                    } else {
                        peg$currPos = s1;
                        s1 = peg$c0;
                    }
                } else {
                    peg$currPos = s1;
                    s1 = peg$c0;
                }
            }
            if (s1 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c35(s1);
            }
            s0 = s1;
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c30);
                }
            }

            return s0;
        }

        function peg$parseDoubleStringCharacters() {
            var s0, s1, s2;

            s0 = peg$currPos;
            s1 = [];
            s2 = peg$parseDoubleStringCharacter();
            if (s2 !== peg$FAILED) {
                while (s2 !== peg$FAILED) {
                    s1.push(s2);
                    s2 = peg$parseDoubleStringCharacter();
                }
            } else {
                s1 = peg$c0;
            }
            if (s1 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c36(s1);
            }
            s0 = s1;

            return s0;
        }

        function peg$parseSingleStringCharacters() {
            var s0, s1, s2;

            s0 = peg$currPos;
            s1 = [];
            s2 = peg$parseSingleStringCharacter();
            if (s2 !== peg$FAILED) {
                while (s2 !== peg$FAILED) {
                    s1.push(s2);
                    s2 = peg$parseSingleStringCharacter();
                }
            } else {
                s1 = peg$c0;
            }
            if (s1 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c36(s1);
            }
            s0 = s1;

            return s0;
        }

        function peg$parseDoubleStringCharacter() {
            var s0, s1, s2;

            s0 = peg$currPos;
            s1 = peg$currPos;
            peg$silentFails++;
            if (input.charCodeAt(peg$currPos) === 34) {
                s2 = peg$c31;
                peg$currPos++;
            } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c32);
                }
            }
            if (s2 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 92) {
                    s2 = peg$c37;
                    peg$currPos++;
                } else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c38);
                    }
                }
                if (s2 === peg$FAILED) {
                    s2 = peg$parseLineTerminator();
                }
            }
            peg$silentFails--;
            if (s2 === peg$FAILED) {
                s1 = peg$c15;
            } else {
                peg$currPos = s1;
                s1 = peg$c0;
            }
            if (s1 !== peg$FAILED) {
                if (input.length > peg$currPos) {
                    s2 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c39);
                    }
                }
                if (s2 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c40(s2);
                    s0 = s1;
                } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$c0;
            }
            if (s0 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 92) {
                    s0 = peg$c37;
                    peg$currPos++;
                } else {
                    s0 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c38);
                    }
                }
            }

            return s0;
        }

        function peg$parseSingleStringCharacter() {
            var s0, s1, s2;

            s0 = peg$currPos;
            s1 = peg$currPos;
            peg$silentFails++;
            if (input.charCodeAt(peg$currPos) === 39) {
                s2 = peg$c33;
                peg$currPos++;
            } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c34);
                }
            }
            if (s2 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 92) {
                    s2 = peg$c37;
                    peg$currPos++;
                } else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c38);
                    }
                }
                if (s2 === peg$FAILED) {
                    s2 = peg$parseLineTerminator();
                }
            }
            peg$silentFails--;
            if (s2 === peg$FAILED) {
                s1 = peg$c15;
            } else {
                peg$currPos = s1;
                s1 = peg$c0;
            }
            if (s1 !== peg$FAILED) {
                if (input.length > peg$currPos) {
                    s2 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c39);
                    }
                }
                if (s2 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c40(s2);
                    s0 = s1;
                } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$c0;
            }
            if (s0 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 92) {
                    s0 = peg$c37;
                    peg$currPos++;
                } else {
                    s0 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c38);
                    }
                }
            }

            return s0;
        }

        function peg$parseLineTerminator() {
            var s0;

            if (peg$c41.test(input.charAt(peg$currPos))) {
                s0 = input.charAt(peg$currPos);
                peg$currPos++;
            } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c42);
                }
            }

            return s0;
        }

        function peg$parse__() {
            var s0, s1;

            s0 = [];
            if (input.charCodeAt(peg$currPos) === 32) {
                s1 = peg$c11;
                peg$currPos++;
            } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c12);
                }
            }
            if (s1 === peg$FAILED) {
                s1 = peg$parseMULTILINECOMMENT();
                if (s1 === peg$FAILED) {
                    s1 = peg$parseEOL();
                }
            }
            while (s1 !== peg$FAILED) {
                s0.push(s1);
                if (input.charCodeAt(peg$currPos) === 32) {
                    s1 = peg$c11;
                    peg$currPos++;
                } else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c12);
                    }
                }
                if (s1 === peg$FAILED) {
                    s1 = peg$parseMULTILINECOMMENT();
                    if (s1 === peg$FAILED) {
                        s1 = peg$parseEOL();
                    }
                }
            }

            return s0;
        }

        function peg$parseMULTILINECOMMENT() {
            var s0, s1, s2, s3, s4, s5;

            s0 = peg$currPos;
            if (input.substr(peg$currPos, 2) === peg$c43) {
                s1 = peg$c43;
                peg$currPos += 2;
            } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c44);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = [];
                s3 = peg$currPos;
                s4 = peg$currPos;
                peg$silentFails++;
                if (input.substr(peg$currPos, 2) === peg$c45) {
                    s5 = peg$c45;
                    peg$currPos += 2;
                } else {
                    s5 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c46);
                    }
                }
                peg$silentFails--;
                if (s5 === peg$FAILED) {
                    s4 = peg$c15;
                } else {
                    peg$currPos = s4;
                    s4 = peg$c0;
                }
                if (s4 !== peg$FAILED) {
                    if (input.length > peg$currPos) {
                        s5 = input.charAt(peg$currPos);
                        peg$currPos++;
                    } else {
                        s5 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c39);
                        }
                    }
                    if (s5 !== peg$FAILED) {
                        s4 = [s4, s5];
                        s3 = s4;
                    } else {
                        peg$currPos = s3;
                        s3 = peg$c0;
                    }
                } else {
                    peg$currPos = s3;
                    s3 = peg$c0;
                }
                while (s3 !== peg$FAILED) {
                    s2.push(s3);
                    s3 = peg$currPos;
                    s4 = peg$currPos;
                    peg$silentFails++;
                    if (input.substr(peg$currPos, 2) === peg$c45) {
                        s5 = peg$c45;
                        peg$currPos += 2;
                    } else {
                        s5 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c46);
                        }
                    }
                    peg$silentFails--;
                    if (s5 === peg$FAILED) {
                        s4 = peg$c15;
                    } else {
                        peg$currPos = s4;
                        s4 = peg$c0;
                    }
                    if (s4 !== peg$FAILED) {
                        if (input.length > peg$currPos) {
                            s5 = input.charAt(peg$currPos);
                            peg$currPos++;
                        } else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c39);
                            }
                        }
                        if (s5 !== peg$FAILED) {
                            s4 = [s4, s5];
                            s3 = s4;
                        } else {
                            peg$currPos = s3;
                            s3 = peg$c0;
                        }
                    } else {
                        peg$currPos = s3;
                        s3 = peg$c0;
                    }
                }
                if (s2 !== peg$FAILED) {
                    if (input.substr(peg$currPos, 2) === peg$c45) {
                        s3 = peg$c45;
                        peg$currPos += 2;
                    } else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c46);
                        }
                    }
                    if (s3 !== peg$FAILED) {
                        s1 = [s1, s2, s3];
                        s0 = s1;
                    } else {
                        peg$currPos = s0;
                        s0 = peg$c0;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$c0;
            }

            return s0;
        }

        function peg$parseEOL() {
            var s0, s1, s2;

            s0 = peg$currPos;
            s1 = [];
            if (peg$c47.test(input.charAt(peg$currPos))) {
                s2 = input.charAt(peg$currPos);
                peg$currPos++;
            } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c48);
                }
            }
            while (s2 !== peg$FAILED) {
                s1.push(s2);
                if (peg$c47.test(input.charAt(peg$currPos))) {
                    s2 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c48);
                    }
                }
            }
            if (s1 !== peg$FAILED) {
                if (input.substr(peg$currPos, 2) === peg$c49) {
                    s2 = peg$c49;
                    peg$currPos += 2;
                } else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c50);
                    }
                }
                if (s2 === peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 10) {
                        s2 = peg$c51;
                        peg$currPos++;
                    } else {
                        s2 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c52);
                        }
                    }
                    if (s2 === peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 13) {
                            s2 = peg$c53;
                            peg$currPos++;
                        } else {
                            s2 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c54);
                            }
                        }
                    }
                }
                if (s2 !== peg$FAILED) {
                    s1 = [s1, s2];
                    s0 = s1;
                } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$c0;
            }

            return s0;
        }

        function peg$parseSAMEDENT() {
            var s0, s1, s2;

            s0 = peg$currPos;
            s1 = [];
            if (peg$c47.test(input.charAt(peg$currPos))) {
                s2 = input.charAt(peg$currPos);
                peg$currPos++;
            } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c48);
                }
            }
            while (s2 !== peg$FAILED) {
                s1.push(s2);
                if (peg$c47.test(input.charAt(peg$currPos))) {
                    s2 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c48);
                    }
                }
            }
            if (s1 !== peg$FAILED) {
                peg$reportedPos = peg$currPos;
                s2 = peg$c55(s1);
                if (s2) {
                    s2 = peg$c15;
                } else {
                    s2 = peg$c0;
                }
                if (s2 !== peg$FAILED) {
                    s1 = [s1, s2];
                    s0 = s1;
                } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$c0;
            }

            return s0;
        }

        function peg$parseINDENTv07() {
            var s0, s1, s2;

            s0 = peg$currPos;
            s1 = [];
            if (peg$c47.test(input.charAt(peg$currPos))) {
                s2 = input.charAt(peg$currPos);
                peg$currPos++;
            } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c48);
                }
            }
            if (s2 !== peg$FAILED) {
                while (s2 !== peg$FAILED) {
                    s1.push(s2);
                    if (peg$c47.test(input.charAt(peg$currPos))) {
                        s2 = input.charAt(peg$currPos);
                        peg$currPos++;
                    } else {
                        s2 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c48);
                        }
                    }
                }
            } else {
                s1 = peg$c0;
            }
            if (s1 !== peg$FAILED) {
                peg$reportedPos = peg$currPos;
                s2 = peg$c56(s1);
                if (s2) {
                    s2 = peg$c15;
                } else {
                    s2 = peg$c0;
                }
                if (s2 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c57(s1);
                    s0 = s1;
                } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$c0;
            }

            return s0;
        }

        function peg$parseINDENT() {
            var s0, s1, s2;

            s0 = peg$currPos;
            s1 = [];
            if (peg$c47.test(input.charAt(peg$currPos))) {
                s2 = input.charAt(peg$currPos);
                peg$currPos++;
            } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c48);
                }
            }
            if (s2 !== peg$FAILED) {
                while (s2 !== peg$FAILED) {
                    s1.push(s2);
                    if (peg$c47.test(input.charAt(peg$currPos))) {
                        s2 = input.charAt(peg$currPos);
                        peg$currPos++;
                    } else {
                        s2 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c48);
                        }
                    }
                }
            } else {
                s1 = peg$c0;
            }
            if (s1 !== peg$FAILED) {
                peg$reportedPos = peg$currPos;
                s2 = peg$c56(s1);
                if (s2) {
                    s2 = peg$c15;
                } else {
                    s2 = peg$c0;
                }
                if (s2 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c58(s1);
                    s0 = s1;
                } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$c0;
            }

            return s0;
        }

        function peg$parseDEDENT() {
            var s0, s1;

            s0 = peg$currPos;
            s1 = [];
            if (s1 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c59();
            }
            s0 = s1;

            return s0;
        }

        var indentStack = [], indent = "";

        peg$result = peg$startRuleFunction();

        if (peg$result !== peg$FAILED && peg$currPos === input.length) {
            return peg$result;
        } else {
            if (peg$result !== peg$FAILED && peg$currPos < input.length) {
                peg$fail({ type: "end", description: "end of input" });
            }

            throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
        }
    }

    return {
        SyntaxError: SyntaxError,
        parse: parse
    };
}
;

module.exports = {
    generate: generate,
    parser: pegJsNapkinParser,
    asTags: generateTags,
    asText: generateText
};

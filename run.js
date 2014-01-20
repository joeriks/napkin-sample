var napkin = require("./napkin").napkin;

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

    napkin.processAll(sampleArray);
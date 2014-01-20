var sample = [{ "node": "TOp", "children": [{ "node": "Toplevelinclude" }] }, { "node": "Include", "children": [{ "node": "This", "children": [{ "node": "Sample" }] }, { "node": "That", "children": [{ "node": "Sample" }] }] }, { "node": "Acme", "attributes": [{ "attr": "foo" }], "children": [{ "node": "ProjectA", "children": [{ "node": "Id", "children": [{ "node": "Identity" }] }, { "node": "Name", "children": [{ "node": "Name of project" }] }, { "node": "Address", "children": [{ "node": "Full address" }, { "node": "Street 123" }] }, { "node": "City" }] }, { "node": "Person", "children": [{ "node": "Id" }, { "node": "Name", "children": [{ "node": "Name of project" }], "processed": "=.ProjectA.Name" }, { "node": "PhoneNumber" }] }] }, { "node": "Hello from mapper" }];

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

var genericprocessor = function (pre, post) {
    var pr = function (level, node) {
        var tabs = repeat("\t", level);

        pre({ level: level, node: node, tabs: tabs });

        //console.log(tabs + "<node name=\"" + node.node + "\">");
        if (node.children) {
            for (var i in node.children) {
                pr(level + 1, node.children[i]);
            }
        }

        post({ level: level, node: node, tabs: tabs });
        //console.log(tabs + "</node>");
    };
    return pr;
};

var tagprocessor = genericprocessor(function (withnode) {
    console.log(withnode.tabs + "<node name=\"" + withnode.node.node + "\">");
}, function (withnode) {
    console.log(withnode.tabs + "</node>");
});

var textprocessor = genericprocessor(function (withnode) {
    console.log(withnode.tabs + withnode.node.node);
}, function (withnode) {
});

module.exports = {
    tags: function (nodes) {
        tagprocessor(0, { node: "..", children: nodes });
    },
    text: function (nodes) {
        textprocessor(0, { node: "..", children: nodes });
    },
    sample: sample
};

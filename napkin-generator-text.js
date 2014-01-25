var traverse = require("traverse");
var napkin = require("./napkin");

napkin.addGenerator("text", function (obj) {
    var s = "";

    traverse(obj).forEach(function to_s(node) {
        if (Array.isArray(node)) {
        } else if (typeof node == 'object') {
            this.before(function () {
                if (node.node) {
                    s += Array(Math.floor(this.level / 2)).join("\t") + node.node + "\n";
                }
            });
        } else if (typeof node == 'string') {
        } else {
            s += node.toString();
        }
    });

    return s;
});

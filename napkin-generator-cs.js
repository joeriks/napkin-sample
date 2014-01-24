var traverse = require("traverse");
var napkin = require("./napkin");

napkin.addGenerator("cs", function (obj) {
    var s = "";

    traverse(obj).forEach(function to_s(node) {
        if (typeof node == 'object') {
            this.before(function () {
                if (node.node) {
                    if (this.level == 1) {
                        s += "namespace " + node.node + " {\n";
                    }
                    if (this.level == 3) {
                        s += "\tpublic class " + node.node + " {\n";
                    }
                    if (this.level == 5) {
                        s += "\t\tpublic string " + node.node + " {get;set;}\n";
                    }
                }
            });

            this.after(function () {
                if (this.level == 1) {
                    s += "}\n";
                }
                if (this.level == 3) {
                    s += "\t}\n";
                }
            });
        }
    });

    return s;
});

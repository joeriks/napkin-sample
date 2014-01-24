var traverse = require("traverse");
var napkin = require("./napkin");

napkin.addGenerator("cs", function (obj) {
    var s = "";

    traverse(obj).forEach(function to_s(node) {
        if (typeof node == 'object') {
            this.before(function () {
                if (node.node) {
                    var text = "";

                    if (this.level == 0) {
                        text = "namespace " + node.node + " {\n";
                    }
                    if (this.level == 1) {
                        text = "public class " + node.node + " {\n";
                    }
                    if (this.level == 1) {
                        text = "public string " + node.node + " {get;set;}\n";
                    }

                    s += Array(this.level + 1).join("\t") + text + "\n";
                }
            });

            this.after(function () {
                if (this.level < 2)
                    s += Array(this.level + 1).join("\t") + '}\n';
            });
        }
    });

    return s;
});

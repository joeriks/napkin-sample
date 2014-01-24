var traverse = require("traverse");
var napkin = require("./napkin");

napkin.addGenerator("text", function (obj) {
    var s = "";

    traverse(obj).forEach(function to_s(node) {
        if (Array.isArray(node)) {
            // this.post(function (child) {
            //    if (!child.isLast) s += ',';
            //});
            //this.after(function () { s += ']' });
        } else if (typeof node == 'object') {
            this.before(function () {
                if (node.node) {
                    s += Array(this.level + 1).join("\t") + node.node + "\n";
                }
            });
            //this.pre(function (x, key) {
            //    to_s(key);
            //    s += ':';
            //});
            //this.post(function (child) {
            //    if (!child.isLast) s += ',';
            //});
            //this.after(function () { s += '}' });
        } else if (typeof node == 'string') {
            //s += '"' + node.toString().replace(/"/g, '\\"') + '"';
        } else {
            s += node.toString();
        }
    });

    return s;
});

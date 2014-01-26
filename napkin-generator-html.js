var traverse = require("traverse");
var napkin = require("./napkin");

napkin.addGenerator("html", function (obj) {
    var s = "";


    var tabs = function (level) {        
        return Array(Math.floor(level / 2)+1).join("\t");
    }

    
    var tag = function(tagname, attributes) {

        attributesString = "";
        if (attributes && attributes.length>0 && attributes[0]!=''){
            attributesString = " class='" + attributes[0] + "'";
        }

        return "<" + tagname + attributesString + ">";
    }
    var tagBegin = function(tagname, text, attributes) {
        return tag(tagname, attributes) + text;
    };
    var tagFull = function(tagname, text, attributes) {
        return tag(tagname, attributes) + text + tagClose(tagname);
    };
    var tagClose = function(tagname) {
        return "</" + tagname + ">";
    }


    definitions = [];
    settings = {};

    var tabLevel = function(objectLevel) {
        return Math.floor((objectLevel-1)/2)+1;
    }


    traverse(obj).forEach(function to_s(node) {
        if (Array.isArray(node)) {
        } else if (typeof node == 'object' && node!=null && !(node.isCommand)) {

            var tagname, classname;

            if (this.level==1) tagname = "h1"; else tagname="p";

            classname ="";
            var definitionByLevel = definitions[tabLevel(this.level)];

            if (definitionByLevel) {
                tagname = definitionByLevel[0];

                if (definitionByLevel.length>1) {
                    classname = definitionByLevel[1];
                }
            }       

            var definitionByFirstWord = definitions[node.name];
            if (definitionByFirstWord) {
                tagname = definitionByFirstWord[0];
                node.name = node.attributes[0];
                node.attributes = node.attributes.slice(1);
                if (definitionByFirstWord.length>1) {
                    classname = definitionByFirstWord[1];
                }
            }

            //s+= node.name + "," + this.level + "\n";
            
            if (this.level==1 && node.name=="/def" && node.children) {
                //s+= "def header" + node.name + "\n";
                node.isCommand = true;
                for (var i in node.children) {

                    var definitionNode = node.children[i];
                    //s+= "added def " + definitionNode.name + "\n";

                    if (definitionNode.name=="hidecomments") {
                        settings.hidecomments = true;
                    } else if (definitionNode.name=="showcomments") {
                        settings.hidecomments = false;
                    } else {
                        definitions[definitionNode.name] = definitionNode.attributes;
                    }
                    
                    definitionNode.isCommand = true;

                }

            }

            //tagname = this.level;//  + definitions[this.level];

            this.before(function () {
                if (node.name && !node.isCommand) {
                    s += tabs(this.level);
                    //s += definitions.join(",");
                    //s += definitions[this.level];
                    if (node.name.comment) {
                        if (!settings.hidecomments && node.name.comment.indexOf("*")!=0)
                            s += "<!--" + node.name.comment + "-->\n";
                    } else {
                    var fullString = (node.attributes)?[node.name].concat(node.attributes).join(" "):node.name;

                    if (node.children && this.level>1) {
                        s += tagBegin(tagname, fullString, [classname]);
                    } else {
                        s += tagFull(tagname, fullString, [classname]);
                    }

                    if (node.comment && !settings.hidecomments  && node.comment.indexOf("*")!=0) {
                        s += "<!--" + node.comment + "-->";
                    }

                    s += "\n";}

                }
            });
            
            this.after(function () {

                if (node.name && node.children && this.level>1) {
                    s += tabs(this.level) + tagClose(tagname) + "\n";
                }                

            });


        } else if (typeof node == 'string') {
        } else if (node!=null && !(node.isCommand)) {
            //s += node.toString();
        }
    });

    return s;
});

var traverse = require("traverse");
var napkin = require("./napkin");
var select = require("js-select");

napkin.addGenerator("html", function (obj) {
    var s = "";


    var tabs = function (level) {        
        return Array(Math.floor(level / 2)+1).join("\t");
    }

    
    var tag = function(tagname, attributes) {

        attributesString = "";

        if (attributes && attributes.length>0 && (attributes[0])){
            attributesString = " class='" + attributes[0] + "'";
        }

        return "<" + tagname + attributesString + ">";
    }
    var tagBegin = function(tagname, text, attributes) {
        return tag(tagname, attributes) + text;
    };
    var tagFull = function(tagname, text, attributes) {        
        return tagBegin(tagname, text, attributes) + tagClose(tagname);
    };
    var tagClose = function(tagname) {
        if (tagname.indexOf("<")==0) return "";
        return "</" + tagname + ">";
    }
    var renderTemplate = function(template, node) {
        var swig = require("swig");
        return swig.render(template, node);        
    }


    definitions = [];
    settings = {};

    var tabLevel = function(objectLevel) {
        return Math.floor((objectLevel-1)/2)+1;
    }

    obj = traverse(obj).forEach(function (node) {
        if (typeof node == 'object' && node.name) {
            node["level-" + tabLevel(this.level)]=true;
            this.update(node);
        }
    });

    matchDefinition = function (node, self, currentMatch) {
        var retVal = {
            isMatch:false,
            tagname:"",
            classname:""};


        for (var id in definitions){
            var matchingDefinition = definitions[id];
            if (id!=currentMatch)
            {
                try
                {
                    if (id==node.name) {
                        retVal.isMatch = true;
                        retVal.tagname = matchingDefinition[0];
                        

                        node.name = node.attributes[0];
                        node.attributes = node.attributes.slice(1);

                        if (matchingDefinition.length>1) {
                            retVal.classname = matchingDefinition[1];
                        }
                        var childMatch = matchDefinition({name:retVal.tagname}, self, id);
                        if (childMatch.isMatch) {
                            retVal = childMatch;
                        } else {
                        }
                        if (retVal.isMatch) break;
                    } else if ((currentMatch=="" && !retVal.isMatch && tabLevel(self.level)==id) || self.matches(id))
                    {
                        retVal.isMatch = true;
                        retVal.tagname = matchingDefinition[0];

                        if (matchingDefinition.length>1) {
                            retVal.classname = matchingDefinition[1];
                        }
                        var childMatch = matchDefinition({name:retVal.tagname, attributes:node.attributes}, self, id);
                        if (childMatch.isMatch) {
                            retVal = childMatch;
                        } else {
                        }
                        //if (retVal.isMatch) break;
                    }
                }
                catch (ex){
                }

            }
        }
        return retVal;
    }

    select(obj).forEach(function to_s(node) {
        if (Array.isArray(node)) {
        } else if (typeof node == 'object' && node!=null && !(node.isCommand)) {

            var tagname, classname;
            tagname = "";
            classname = "";

            var matched = matchDefinition(node,this,"");
            if (!matched.tagname) matched.tagname ="";
            if (this.level==1 && node.name=="/def" && node.children) {
                node.isCommand = true;
                for (var i in node.children) {

                    var definitionNode = node.children[i];

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

            this.before(function () {
                if (node.name && !node.isCommand) {
                    s += tabs(this.level);
                    if (node.name.comment ) {
                        
                        if (!settings.hidecomments && node.name.comment.indexOf("*")!=0)
                            s += "<!--" + node.name.comment + "-->\n";
                    } else {

                        var fullString = (node.attributes)?[node.name].concat(node.attributes).join(" "):node.name;

                        var isTemplate = ((matched.tagname.indexOf("{{")!=-1 && matched.tagname.indexOf("}}")!=-1) || (matched.tagname.indexOf("{%")!=-1 && matched.tagname.indexOf("%}")!=-1));
                        if (isTemplate) {                            
                            node.renderChildren = "{{renderChildren}}";
                            node.name = fullString;
                            renderedTemplate = renderTemplate(matched.tagname, {locals: node});                           
                            if (node.children) {
                                var childrenSplit = renderedTemplate.split(node.renderChildren);
                                if (childrenSplit.length>1) {
                                    node.afterChildren = childrenSplit[1];
                                } else {
                                }
                            
                                s += childrenSplit[0];
                                s += "\n"; 
                            } else {
                                s += renderedTemplate + "\n";
                            }
            
                            
                        } else {

                            if (matched.tagname) {
                                if (node.children && this.level>1) {
                                    s += tagBegin(matched.tagname, fullString, [matched.classname]);
                                } else {
                                    s += tagFull(matched.tagname, fullString, [matched.classname]);
                                    s += "\n";
                                }
                            }
                            if (node.comment && !settings.hidecomments  && node.comment.indexOf("*")!=0) {
                                s += "<!--" + node.comment + "-->";
                            }
                        }

                    }

                }
            });
            
            this.after(function () {

                if (!node.afterChildren && node.name && node.children && this.level>1) {
                    s += tabs(this.level) + tagClose(matched.tagname) + "\n";
                }                
                if (node.afterChildren) {
                    s += tabs(this.level) + node.afterChildren + "\n";
                }            
            });


        } else if (typeof node == 'string') {
        } else if (node!=null && !(node.isCommand)) {
        }
    });

    return s;
});

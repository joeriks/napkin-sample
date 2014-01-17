#Napkin DSL + Code generation

###Version 0.03 - poc / demonstration / alpha

Human readable custom made syntax + code generation using project-custom string templates. Using Node and Npm packages. Most importantly PEGjs for parser generation. 

Grunt runs the parser + generator and starts watching for changes of .txt files.

The sample.txt contains:

	Acme
			Project
					Id key
							"Identity"
					Name
							"Name of project"
							"Helptext"
					Address
							"Full address"
							"Street 123"
					City
					

Which parses to a json, and from there generates one cs and one html, based on easy to customise templates, to for example:

	namespace Acme {        
        public class Project { 
			[DisplayName("Identity")]
			public int Id {get;set;}
			[DisplayName("Name of project")]
			[DisplayHelp("Helptext")]
			public string Name {get;set;}
			[DisplayName("Full address")]
			[DisplayHelp("Street 123")]
			public string Address {get;set;}
			public string City {get;set;}
        }					
					
Article + video : http://joeriks.com/2014/01/14/a-simple-dsl-code-generation-using-node/

##Reasons

1) to keep the domain type specifications above everything else, dependent on nothing

2) to be able to easily communicate the specifications with the domain knowers (my clients) in a human understandable – and not cluttered – language

3) to be able to use the code to generate necessary types and code in whatever syntax necessary; C#, Typescript and Javascript for example

4) to make it possible for easy iterations of “top-level changes” – for me or the business persons themselves to see the results of adding and changing details immediately. Without involving the ordinary developer process.

##Napkin Syntax

Write text with tab indentations to create a object tree with nodes and children.

	Node1
		ChildNode11
		ChildNode12
			GrandChildNode121
			GrandChildNode122

Node names are literals or strings

	Node1
		"Child Node 1"
		"Child Node 2"

Add text in columns to add attributes.

	Node
		ChildNode Attribute1 Attribute2

Use equal sign to name attributes

	Node
		ChildNode Name=Attribute1 Color=Attribute2

Attributes can also be strings

	Node
		ChildNode Name="Foo Bar"

For comments use /* */

You can add commands to your code

Include (and parse) another file. Result will be put on top of the existing file.

	/include "main.txt"

Map the result through a javascript file.

	/map "samplemap.js"

The syntax for the map file is 

	module.exports = function(model) { /* do something */ return model; }

##Generator Syntax

	var r = require("./generator");
	var parsedResult = r("somefile.txt");
	r({infile:"somefile.txt",template:"sometemplate.swig",out:"result.cs"});

	// saving parsed json
	r({infile:"somefile.txt",resultout:"somefile.json"});

	//define parser (js file)
	r({parser:"parser", infile:"somefile.txt"});


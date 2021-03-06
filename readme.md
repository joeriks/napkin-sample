#Napkin DSL + Code generation

###Version 0.045 - poc / demonstration / alpha / rfc

Human readable custom made syntax + code generation using project-custom string templates. Using Node and Npm packages. Most importantly PEGjs for parser generation. 

Grunt runs the parser + generator and starts watching for changes of .txt files.

The acme_types.txt contains:


	/reference "reference.txt" Ref
	/out "acme.cs" "cs"

	Acme

		Project
			Id i

			Name
				"Name of project"

		Client
			Id i
			=..References.Address._  

			Projects "List<Project>" 

					
Which parses to a javascript object, and from there generates a cs (based on the "out" command), based on built in easy to customise templates, to:

	namespace Acme {
		public class Project {
			public int Id {get;set;}
			[Description("Name of project")]
			public string Name {get;set;}
		}
		public class Client {
			public int Id {get;set;}
			[Description("Full address")]
			[Description("i.e. Street 123")]
			public string Address {get;set;}
			public string City {get;set;}
			public string ZipCode {get;set;}
			[Description("Optional")]
			public string Country {get;set;}
			public List<Project> Projects {get;set;}
		}

					
Article + video : http://joeriks.com/2014/01/14/a-simple-dsl-code-generation-using-node/

##Reasons

1) to keep the domain type specifications above everything else, dependent on nothing

2) to be able to easily communicate the specifications with the domain knowers (my clients) in a human understandable – and not cluttered – language

3) to be able to use the code to generate necessary types and code in whatever syntax necessary; C#, Typescript and Javascript for example

4) to make it possible for easy iterations of “top-level changes” – for me or the business persons themselves to see the results of adding and changing details immediately. Without involving the ordinary developer process.

##Napkin Syntax

General purpose easy to write and read object notation syntax

###Version 0.045 - poc / demonstration / alpha / rfc

Write text with tab indentations to define the objects

	Node1
		ChildNode11
		ChildNode12
			GrandChildNode121
			GrandChildNode122

The napkin.js parser outputs it to this object:

	[{
		node:"Node1",
		children: [
			{node:"ChildNode11"},
			{node:"ChildNode12",
			children:[
				{node:"GrandChildNode121"},
				{node:"GrandChildNode122"}]}]
	}]

Node names can be literals or strings

	Node1
		"Child Node 1"
		"Child Node 2"

Add text in columns to add attributes.

	Node
		ChildNode Attribute1 Attribute2

Result:

	[{
		node:"Node",
		children: [
			{node:"ChildNode",
			attributes:[
				{"attr":"Attribute1"},
				{"attr":"Attribute2"}]}]
	}]

Use equal sign to name attributes

	Node
		ChildNode Name=Attribute1 Color=Attribute2

Result

	[{
		node:"Node",
		children: [
			{node:"ChildNode",
			attributes:[
				{"Name":"Attribute1"},
				{"Color":"Attribute2"}]}]
	}]

Attributes can also be strings

	Node
		ChildNode Name="Foo Bar"


Reference to copy node or all children

	Parent
		Foo
			"Something"
		Bar
			Baz
			Bah

	Node
		=.Parent.Foo

		=.Parent.Bar._

Multiline texts works

	Parent
		Foo
			"Something
			On
			Several lines"

Comments

	/* For comments use */

###Include files and map the result with commands

If you use the generator you can run include and map commands.

Include (and parse) another file. Result will be put on top of the existing file.

	/include "main.txt"

Reference (and parse) another file. Result will be available for reference instructions.

	/reference "main.txt"

Map the result through a javascript file.

	/map "samplemap.js"

The syntax for the map file is 

	module.exports = function(model) { /* do something */ return model; }

Result out to json

	/out "sample.json" "json"

Result out to text

	/out "sample.txt" "txt"

Result out to xml nodes

	/out "sample.xml" "xml"

Result out to cs classes

	/out "sample.cs" "cs"

##Generator Syntax

	var r = require("./generator");

Parse napkin code file and return the result object

	var parsedResult = r("somefile.txt");

Use the result object with a swig text template and generate a file

	r({infile:"somefile.txt",template:"sometemplate.swig",out:"result.cs"});

Save the json

	r({infile:"somefile.txt",resultout:"somefile.json"});

Define parser (js file)

	r({parser:"alternativeparser", infile:"somefile.txt"});


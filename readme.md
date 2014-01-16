Human readable custom made syntax + code generation using project-custom string templates. Using Node and Npm packages. Most importantly PEGjs for parser generation. 

Grunt runs the parser + generator and starts watching for changes of .txt files.

The sample.txt contains:

	Acme
			Project
					Id:key
							"Identity"
					Name
							"Name of project"
							"Helptext"
					Address
							"Full address"
							"Street 123"
					City
					

Which parses to a json with object, and from there generates one cs and one html, based on templates, for example:

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

Reasons

1) to keep the domain type specifications above everything else, dependent on nothing

2) to be able to easily communicate the specifications with the domain knowers (my clients) in a human understandable – and not cluttered – language

3) to be able to use the code to generate necessary types and code in whatever syntax necessary; C#, Typescript and Javascript for example

4) to make it possible for easy iterations of “top-level changes” – for me or the business persons themselves to see the results of adding and changing details immediately. Without involving the ordinary developer process.
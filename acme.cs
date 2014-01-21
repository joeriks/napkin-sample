namespace Acme {
	public class Client {
		[Description("Database id")]
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
	public class Project {
		[Description("Database id")]
		public int Id {get;set;}
		[Description("Name of project")]
		public string Name {get;set;}
		[Description("Full address")]
		[Description("i.e. Street 123")]
		public string Address {get;set;}
		public string City {get;set;}
		public string ZipCode {get;set;}
		[Description("Optional")]
		public string Country {get;set;}
	}
	public class Person {
		[Description("Database id")]
		public int Id {get;set;}
		public string FirstName {get;set;}
		public string SecondName {get;set;}
		[Description("Full address")]
		[Description("i.e. Street 123")]
		public string Address {get;set;}
		public string City {get;set;}
		public string ZipCode {get;set;}
		[Description("Optional")]
		public string Country {get;set;}
	}
}

namespace Top {
	public class Toplevelinclude {
	}
}
namespace Include {
	public class This {
		public string Sample {get;set;}
	}
	public class That {
		public string Sample {get;set;}
	}
}
namespace Root {
	public class RootId {
		public string root {get;set;}
	}
}
namespace Acme {
	public class Id {
		public string DatabaseId {get;set;}
	}
	public class Address_Mixin {
		[Description("Full address")]
		[Description("i.e. Street 123")]
		public string Address {get;set;}
		public string City {get;set;}
		public string ZipCode {get;set;}
	}
	public class Client {
		public string =..Root.RootId {get;set;}
		public string =..Acme.Id {get;set;}
		[Description("DatabaseId")]
		public int Id {get;set;}
		[Description("Full address")]
		[Description("i.e. Street 123")]
		public string Address {get;set;}
		public string City {get;set;}
		public string ZipCode {get;set;}
		public List<Project> Projects {get;set;}
	}
	public class Project {
		[Description("DatabaseId")]
		public int Id {get;set;}
		[Description("Name of project")]
		public string Name {get;set;}
		[Description("Full address")]
		[Description("i.e. Street 123")]
		public string Address {get;set;}
		public string City {get;set;}
		public string ZipCode {get;set;}
	}
	public class Person {
		[Description("DatabaseId")]
		public int Id {get;set;}
		public string FirstName {get;set;}
		public string SecondName {get;set;}
		[Description("Full address")]
		[Description("i.e. Street 123")]
		public string Address {get;set;}
		public string City {get;set;}
		public string ZipCode {get;set;}
	}
}

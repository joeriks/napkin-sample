
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
	
	public class Person { 
	 public int Id {get;set;}
	 public string Name {get;set;}
	 public string PhoneNumber {get;set;}
	}
	
}

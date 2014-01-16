{% for namespace in model %}
namespace {{ namespace.name }} {
	{% for ty in namespace.types %}
	public class {{ty.name}} { {% for member in ty.members %}{%if member.col_0%}
	 [DisplayName("{{member.col_0}}")]{%endif%}{%if member.col_1%}
	 [DisplayHelp("{{member.col_1}}")]{%endif%}
	 public {% if (member.type=='key') %}int{% else %}{{member.type}}{%endif%} {{ member.name }} {get;set;}{% endfor %}
	}
	{% endfor %}
}
{% endfor %}
{% for node in model %}
namespace {{ node.node }} {
	{% for ty in node.children %}
	public class {{ty.node}} { {% for member in ty.children %}{%if member.col_0%}
	 [DisplayName("{{member.col_0}}")]{%endif%}{%if member.col_1%}
	 [DisplayHelp("{{member.col_1}}")]{%endif%}
	 public {% if (member.type=='key') %}int{% else %}{%if (!(member.type)) %}string{%else%}{{member.type}}{%endif%} {{ member.node }} {get;set;}{% endfor %}
	}
	{% endfor %}
}
{% endfor %}
{% for namespace in model %}
<h1>{{ namespace.name }}</h1>
<div>
	{% for ty in namespace.types %}
	<h2>{{ty.name}}</h2>
	<ul>
	{% for member in ty.members %}
	
	<li>
	({{ member.name }})<br/>
	{%if member.col_0%}<strong>{{member.col_0}}</strong>{%endif%}
	
	<input type=text placeholder="{%if member.col_1%}{{member.col_1}}{%endif%}"/>
	 
	 </li>
	 {% endfor %}
	 </ul>
	{% endfor %}
</div>
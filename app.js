const $ = (id) => document.getElementById(id);
const catalog = [
	["Melk", 555, 1.5, 4.8, 10.7, "lactose", "auto", ["melk", "halfvolle melk"]],
	["Room", 280, 40, 3, 45.5, "lactose", "auto", ["room", "slagroom"]],
	["Eidooier", 60, 27, 0.6, 48, "sucrose", "vast", ["eidooier", "eigeel"]],
	["Cacaopoeder", 65, 21, 0.9, 97, "sucrose", "vast", ["cacao", "cacaopoeder"]],
	[
		"Mager melkpoeder",
		30,
		0.8,
		52,
		96,
		"lactose",
		"auto",
		["melkpoeder", "mager melkpoeder"],
	],
	[
		"Kristalsuiker",
		132,
		0,
		100,
		100,
		"sucrose",
		"auto",
		["suiker", "kristalsuiker"],
	],
	["Vanillesuiker", 8, 0, 100, 100, "sucrose", "vast", ["vanillesuiker"]],
	["Glucosestroop", 70, 0, 80, 80, "stroop", "vast", ["glucosestroop"]],
	[
		"Pure chocolade 72%",
		80,
		42,
		27,
		99,
		"sucrose",
		"stukjes",
		["chocolade", "pure chocolade"],
	],
	["Volle melk", 100, 3.5, 4.8, 12.5, "lactose", "auto", ["volle melk"]],
	["Dextrose (watervrij)", 50, 0, 100, 100, "dextrose", "auto", ["dextrose"]],
	["Water", 100, 0, 0, 0, "sucrose", "auto", ["water"]],
];
const make = (a) => ({
	name: a[0],
	g: a[1],
	fat: a[2],
	sugar: a[3],
	solids: a[4],
	type: a[5],
	role: a[6],
});
let rows = catalog.slice(0, 9).map(make),
	lastBatch = 1200;
const escape = (s) =>
	String(s).replace(
		/[&<>"']/g,
		(c) =>
			({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
				c
			],
	);
try {
	const saved = JSON.parse(localStorage.getItem("ijslab-v2"));
	if (saved) {
		validate(saved.rows, saved.batch, saved.targets);
		rows = saved.rows;
		$("flavour").value = saved.flavour || "chocolate";
		lastBatch = saved.batch;
		$("batch").value = lastBatch;
		["fat", "sugar", "solids"].forEach(
			(k, i) => ($(k).value = saved.targets[i]),
		);
	}
} catch {}
function targets() {
	return ["fat", "sugar", "solids"].map((k) => Number($(k).value));
}
function save() {
	try {
		localStorage.setItem(
			"ijslab-v2",
			JSON.stringify({
				rows,
				batch: Number($("batch").value),
				targets: targets(),
				flavour: $("flavour").value,
			}),
		);
	} catch {}
}
function render() {
	$("rows").innerHTML = rows
		.map(
			(r, i) =>
				`<div class="ingredient" data-i="${i}"><div class="ingredientline"><strong>${escape(r.name)}</strong>${["fat", "sugar"].map((k) => `<input aria-label="${k === "fat" ? "Vet" : "Suiker"} ${escape(r.name)}" type="number" min="0" max="100" step=".1" data-k="${k}" value="${r[k]}">`).join("")}<button class="remove" data-remove="${i}" aria-label="Verwijder ${escape(r.name)}">×</button></div><details ${r.needsDetails ? "open" : ""}><summary>Details${r.role === "vast" ? " · " + r.g.toFixed(1) + " g vast" : r.role === "stukjes" ? " · stukjes" : ""}</summary><div class="rowdetails"><label>Hoeveelheid (g)<input type="number" min="0" step=".1" data-k="g" value="${Math.round(r.g * 10) / 10}"></label><label>Hoeveelheid bepalen<select data-k="role">${[
					["auto", "Automatisch"],
					["vast", "Vaste hoeveelheid"],
					["stukjes", "Stukjes / toevoeging"],
				]
					.map(
						([k, label]) =>
							`<option value="${k}" ${r.role === k ? "selected" : ""}>${label}</option>`,
					)
					.join(
						"",
					)}</select></label><label>Droge stof %<input type="number" min="0" max="100" step=".1" data-k="solids" value="${r.solids}"></label><label>Suikertype<select data-k="type">${Object.keys(
					sugarTypes,
				)
					.map((k) => `<option ${r.type === k ? "selected" : ""}>${k}</option>`)
					.join("")}</select></label></div></details></div>`,
		)
		.join("");
	show();
}
function show(message) {
	const a = analyse(rows);
	$("total").textContent = `${a.total.toFixed(1)} g totaal`;
	const names = ["Vet", "Totale suikers", "Droge stof", "PAC ≈", "POD ≈"];
	$("metrics").innerHTML = [...a.values, ...a.indices]
		.map(
			(v, i) =>
				`<div class="metric"><small>${names[i]}</small><b>${Number.isFinite(v) ? v.toFixed(1) : "—"}${i < 3 ? "%" : ""}</b><span>${i < 3 ? "doel " + targets()[i].toFixed(1) + "%" : "g sucrose-equivalent / 100 g"}</span></div>`,
		)
		.join("");
	$("recipe").innerHTML = rows
		.map(
			(r) =>
				`<div>${escape(r.name)}${r.role === "stukjes" ? " · stukjes" : ""}<b>${r.g.toFixed(1)} g</b></div>`,
		)
		.join("");
	$("status").textContent =
		message ||
		`${a.mass.toFixed(1)} g ijsbasis. Klik op berekenen om je recept aan te passen.`;
	save();
}
$("rows").addEventListener("change", (e) => {
	const k = e.target.dataset.k;
	if (!k) return;
	const i = Number(e.target.closest("[data-i]").dataset.i);
	const previousFat = rows[i].fat;
	rows[i][k] = ["name", "role", "type"].includes(k)
		? e.target.value
		: e.target.value === ""
			? NaN
			: Number(e.target.value);
	if (k === "fat" && Number.isFinite(rows[i].fat)) {
		rows[i].solids = Math.max(
			rows[i].fat + rows[i].sugar,
			Math.min(100, rows[i].solids + rows[i].fat - previousFat),
		);
	}
	show("Aangepast. Klik op berekenen voor een nieuw recept.");
});
$("rows").addEventListener("click", (e) => {
	if (e.target.dataset.remove !== undefined) {
		rows.splice(Number(e.target.dataset.remove), 1);
		render();
	}
});
$("names").innerHTML = catalog.map((a) => `<option value="${a[0]}">`).join("");
$("addform").onsubmit = (e) => {
	e.preventDefault();
	const name = $("newname").value.trim();
	if (!name) return;
	const lower = name.toLowerCase();
	const found = catalog.find(
		(a) => a[0].toLowerCase() === lower || a[7].includes(lower),
	);
	const row = found
		? make(found)
		: {
				name,
				g: 0,
				fat: 0,
				sugar: 0,
				solids: 0,
				type: "sucrose",
				role: "vast",
				needsDetails: true,
			};
	row.name = name;
	if (found) row.g *= Number($("batch").value) / 1200;
	rows.push(row);
	$("newname").value = "";
	render();
	$("recognition").textContent = found
		? "Herkend: " +
			found[0] +
			". Controleer de standaardwaarden op je verpakking."
		: "Onbekend product: vul zelf gram, vet, suiker, droge stof en suikertype in. Er zijn geen voedingswaarden opgezocht.";
};
$("batch").onchange = () => {
	const n = Number($("batch").value);
	if (n >= 100 && n <= 10000) {
		rows.forEach((r) => (r.g *= n / lastBatch));
		lastBatch = n;
		render();
	} else show("Kies een batch tussen 100 en 10.000 gram.");
};
["fat", "sugar", "solids"].forEach(
	(k) => ($(k).onchange = () => show("Doelen aangepast. Balanceer opnieuw.")),
);
$("solve").onclick = () => {
	try {
		rows = balance(rows, Number($("batch").value), targets());
		render();
		const a = analyse(rows);
		const delta = Math.max(
			...a.values.map((v, i) => Math.abs(v - targets()[i])),
		);
		show(
			delta <= 0.3
				? "✓ Je recept is berekend. De samenstelling past bij je gekozen balans."
				: "△ Doelen niet allemaal haalbaar met deze ingrediënten en vaste hoeveelheden. Beste benadering getoond; grootste afwijking " +
						delta.toFixed(2) +
						" procentpunt. Pas je doelen of vaste ingrediënten aan.",
		);
	} catch (e) {
		$("status").textContent = e.message;
	}
};
function setFlavour() {
	const vanilla = $("flavour").value === "vanilla";
	rows = catalog
		.slice(0, 9)
		.filter((r, i) => !vanilla || ![3, 8].includes(i))
		.map(make);
	if (vanilla) {
		rows[0].g += 65;
	}
	const batch = Number($("batch").value) || 1200;
	rows.forEach((r) => (r.g *= batch / 1200));
	lastBatch = batch;
	["fat", "sugar", "solids"].forEach(
		(k, i) => ($(k).value = (vanilla ? [12, 20, 38] : [12.5, 20.6, 42])[i]),
	);
	render();
}
$("flavour").onchange = setFlavour;
$("reset").onclick = () => {
	$("batch").value = 1200;
	setFlavour();
};
$("export").onclick = () => {
	const text =
		"IJslab — recept\n" +
		rows.map((r) => `${r.name}: ${r.g.toFixed(1)} g (${r.role})`).join("\n") +
		"\n\n" +
		$("status").textContent +
		"\n\nAnalyse ijsbasis: " +
		$("metrics").textContent +
		"\nStandaardwaarden zijn schattingen; controleer etiketten.";
	const a = document.createElement("a");
	a.href = URL.createObjectURL(
		new Blob([text], { type: "text/plain;charset=utf-8" }),
	);
	a.download = "ijslab-recept.txt";
	a.click();
	URL.revokeObjectURL(a.href);
};
render();

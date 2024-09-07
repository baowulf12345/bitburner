/** @param {NS} ns */
export async function main(ns) {
	var i = 0;
	var hostname = "home";
	var threads = ns.args[0];
	const currentscriptnum = (ns.getScriptName()).replace(/\D+/g, '');
	const script = "arg_target" + currentscriptnum + ".js";
	const hostmap = new Map();
	const hosts = new Array(
		"n00dles", "foodnstuff", "sigma-cosmetics", "joesguns", "nectar-net", "hong-fang-tea", "harakiri-sushi",
		"neo-net", "aevum-police", "silver-helix", "catalyst", "johnson-ortho", "crush-fitness", "netlink",
		"the-hub", "summit-uni", "rothman-uni", "iron-gym", "phantasy", "rho-construction", "millenium-fitness",
		"alpha-ent", "syscore", "snap-fitness", "lexo-corp", "omega-net", "max-hardware", "computek", "zer0",
		"unitalife", "zb-institute", "solaris", "nova-med", "zb-def", "zeus-med", "univ-energy", "global-pharm",
		"microdyne", "helios", "galactic-cyber", "deltaone", "titan-labs", "icarus", "omnia", "infocomm", "taiyang-digital",
		"aerocorp", "defcomm", "fulcrumtech", "blade", "powerhouse-fitness", "4sigma", "fulcrumassets", "megacorp",
		"CSEC", "run4theh111z", "applied-energetics", "vitalife", "The-Cave", "stormtech", "nwo", "clarkinc", "omnitek",
		"b-and-a", "ecorp", "kuai-gong"
	);
	for (let host of hosts) {
		hostmap.set(host, ns.getServerRequiredHackingLevel(host));
	}
	const sortedHosts = [...hostmap.entries()]
		.sort((a, b) => b[1] - a[1])
		.filter(([host, hackingLevel]) => hackingLevel < ns.getHackingLevel() && ns.getServerMaxMoney(host) > 0)

	for (let [target, level] of sortedHosts) {
		if (ns.isRunning(script,hostname)) {
			ns.scriptKill(script,hostname);
		}
		if (ns.getServerRequiredHackingLevel(target) < ns.getHackingLevel()) {
			await ns.exec(script, hostname, threads, target);
			await ns.sleep(100);
		}
	}
	ns.tprint(script + " COMPLETED");
}
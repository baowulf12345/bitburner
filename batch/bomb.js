/** @param {NS} ns */
export async function main(ns) {
	ns.tail();
	ns.disableLog("ALL");

	function post(message) {
		ns.print(message);
		ns.toast(message);
	}

	function getServers() {
		let servers = ["home"];
		for (let i = 0; i < servers.length; i++) {
			let found = ns.scan(servers[i]);
			for (let j = 0; j < found.length; j++) {
				if (servers.indexOf(found[j]) >= 0) continue;
				servers.push(found[j]);
			}
		}
		return servers;
	}
	const hostmap = new Map();
	var hosts = getServers();
	if (ns.args[0]) {
		var limit = ns.args[0];
	} else {
		var limit = 1;
	}
	post("BATCH BOMB! You better have a LOT of RAM. Targeting top " + limit + " servers.");

	for (let host of hosts) {
		if (!ns.isRunning("batch/manager.js", "home", host)) {
			hostmap.set(host, ns.getServerMaxMoney(host));
		}
	}
	const sortedHosts = [...hostmap.entries()]
		.sort((a, b) => b[1] - a[1])
		.filter(([host, servermoney]) => servermoney <= ns.getServerMaxMoney(host))
		.slice(0, limit);


	for (let server of sortedHosts) {
		post("Starting Batch Manager for " + server[0]);
		ns.exec("batch/manager.js", "home", 1, server[0]);
	}
}
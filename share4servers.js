import { getSettings, getServers, calcAvailableRam } from '/lib/sharedfunctions.js'

export async function main(ns) {
	// Variable declarations.
	var i = 0;
	var threads = Math.floor(ns.args[0]);
	const script = "share.js";
	const hostmap = new Map();
	const hosts = getServers(ns);

	// Build a host map, and filter out any servers we can't hack yet or have no money.
	for (let host of hosts) {
		hostmap.set(host, ns.getServerRequiredHackingLevel(host));
	}
	const sortedHosts = [...hostmap.entries()]
		.sort((a, b) => b[1] - a[1])
		.filter(([host, hackingLevel]) => hackingLevel < ns.getHackingLevel() && ns.getServerMaxMoney(host) > 0)
		.slice(0, 10);

	// begin loop through each purchased server.
	while (i < ns.getPurchasedServerLimit()) {
		const hostname = "pserv-" + i;
		// If the script isn't present, copy it over. Otherwise, kill all running processes related to the script, THEN
		// delete the version present on the server and copy a fresh version over.
		if (!ns.fileExists(script, hostname)) {
			ns.scp(script, hostname);
		} else {
			for (let [target, level] of sortedHosts) {
				if (ns.scriptRunning(script, hostname, threads, target)) {
					await ns.scriptKill(script, hostname, threads, target);
					await ns.sleep(200);
				}
			}
			await ns.rm(script, hostname);
			await ns.scp(script, hostname);
		}

		// For each server, start up the script.
		for (let [target, level] of sortedHosts) {
			if (ns.getServerRequiredHackingLevel(target) < ns.getHackingLevel()) {
				await ns.exec(script, hostname, threads, target);
				await ns.sleep(200);
			}
		}
		i++;
		ns.tprint("Working..." + i + "/" + ns.getPurchasedServerLimit());
		await ns.sleep(1000);
	}
	ns.tprint(script + " COMPLETED");
}
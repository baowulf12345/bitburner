/** @param {NS} ns */
import { getSettings, getServers, calcAvailableRam } from '/lib/sharedfunctions.js'

export async function main(ns) {

	const hostmap = new Map();
	const hosts = getServers(ns);
	for (let host of hosts) {
		hostmap.set(host, ns.getServerRequiredHackingLevel(host));
	}
	const sortedHosts = [...hostmap.entries()]
		.sort((a, b) => b[1] - a[1])
		.filter(([host, hackingLevel]) => hackingLevel < ns.getHackingLevel() && ns.getServerMaxMoney(host) > 0)
		.slice(0, 10);

	/*
		const scripts = new Array(
			"arg4servers.js",
			"grow4servers.js",
			"share4servers.js"
		);
		// 	For some reason, "weaken4servers.js" will crash the server, so it is excluded.
	*/

	const scripts = new Array(
		"arg_target0.js",
		"quick_grow.js",
		"share.js"
	)

	var i = 0;
	const argscriptRam = ns.getScriptRam("arg_target0.js");
	const growscriptRam = ns.getScriptRam("quick_grow.js");
	const sharescriptRam = ns.getScriptRam("share.js");


	while (i < ns.getPurchasedServerLimit()) {
		const hostname = "pserv-" + i;
		ns.killall(hostname);
		var availableRam = calcAvailableRam(ns, hostname);
		let maxThreads = Math.floor(availableRam / Math.max(argscriptRam, sharescriptRam, growscriptRam));
		if (maxThreads < 100) {
			var target = sortedHosts[4][0];
			ns.scp("arg_target0.js", hostname);
			ns.tprint("Host:" + hostname + " Max:" + maxThreads + " Threads:" + Math.floor(availableRam / argscriptRam) + " Target:" + target);
			ns.exec("arg_target0.js", hostname, Math.floor(availableRam / argscriptRam), target);
			i++;
			await ns.sleep(10);
			continue;
		}

		for (const script of scripts) {
			switch (script) {
				case "arg_target0.js":
					var useThreads = Math.floor(maxThreads / 20);
					break;
				case "quick_grow.js":
					var useThreads = Math.floor(maxThreads / 40);
					break;
				case "share.js":
					var useThreads = Math.floor(maxThreads / 40);
					break;
			}
			if (useThreads <= 1) { useThreads = 1; }
			ns.scp(script, hostname);
			for (let [target, level] of sortedHosts) {
				//if (batchtarget == target) { continue; }
				if (ns.getServerRequiredHackingLevel(target) < ns.getHackingLevel()) {
					ns.exec(script, hostname, useThreads, target);
				}
			}
			await ns.sleep(10);
		}
		ns.tprint("Host:" + hostname + " Max:" + maxThreads + " ARG:" + useThreads);
		i++;
	}
}
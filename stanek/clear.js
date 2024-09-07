/** @param {NS} ns */
export async function main(ns) {
	var script = "stanek/manager.js";
	for (let server of ns.getPurchasedServers()) {
		if (ns.scriptRunning(script, server)) {
			ns.scriptKill(script, server);
		}
	}
}
/** @param {NS} ns */
export async function main(ns) {
	var serverList = ns.getPurchasedServers();
	for (let hostname of serverList) {
		if (ns.fileExists("batch/settings.txt", hostname)) {
			for (let j = 0; j < 4; j++) {
				var scriptname = "arg_target" + j + ".js";
				ns.scriptKill(scriptname, hostname);
			}
		} else {
			ns.killall(hostname);
		}
	}
}
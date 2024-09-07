/** @param {NS} ns */
import { calcAvailableRam } from '/lib/sharedfunctions.js'

export async function main(ns) {
	var i = 0;
	var target = ns.args[0];
	var threads = ns.args[1];
	var script = "arg_target.js";
	var scriptRam = ns.getScriptRam(script, "home");
	var ramneeded = threads * scriptRam;

	while (i < ns.getPurchasedServerLimit()) {
		var hostname = ("pserv-" + i);
		//remove the killall...
		//killall(hostname);
		if (ns.serverExists(hostname)) {
			var availableRam = calcAvailableRam(ns, hostname);
			if (ns.isRunning(script, hostname, target)) {
				ns.kill(script, hostname, target);
			}
			if (availableRam > ramneeded) {
				ns.exec(script, hostname, threads, target);
			}

			++i;
		}
	}
	availableRam = calcAvailableRam(ns, "home");
	if (ns.isRunning(script, "home", target)) {
		ns.kill(script, "home", target);
	}
	if (availableRam > ramneeded) {
		ns.exec(script, "home", threads, target);
	}
}
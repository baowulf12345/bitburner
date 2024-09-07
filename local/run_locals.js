export async function main(ns) {
	const targetcount = ns.args[0];
	const availableram = ns.getServerMaxRam("home") - ns.getServerUsedRam("home");
	for (var i = 0; i < 5; i++) {
		var scriptname = "/local/arg" + i + "local.js";
		var argname = "arg_target" + i + ".js";
		const scriptram = ns.getScriptRam(argname, "home");
	// Threads = available RAM divided by the RAM required by the script
	// divided by the quantity of targets we're going to attack times the quantity of scripts.
		var threads = Math.floor((availableram / scriptram) / (targetcount * 5));
		if (threads > 800) {
			threads = 800;
		} else if (threads < 100) {
			ns.tprint("Available RAM too low. ((" + availableram + "/" + scriptram + ") / (" + targetcount + " * 5) = " + threads + " threads count.) Stopping.");
			break;
		}
		ns.exec(scriptname, "home", 1, threads);
	}
}
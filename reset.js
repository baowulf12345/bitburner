/** @param {NS} ns */
import { getSettings, post } from '/lib/sharedfunctions.js'

export async function main(ns) {
	ns.disableLog("getPlayer");
	const global_settings_file = "globalsettings.txt";
	const global_settings = getSettings(ns, global_settings_file);

	if (ns.getPlayer().playtimeSinceLastBitnode < 300000) {
		for (let settingsfile of Object.values(global_settings["files"]["settings"])) {
			var settings = getSettings(ns, "default/" + settingsfile);
			ns.write(settingsfile, JSON.stringify(settings, null, 2), "w");
		}
	} else {
		post(ns, "WARNING: DO NOT EXECUTE reset.js unless you just started a new bitnode.");
	}
}
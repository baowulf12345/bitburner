/** @param {NS} ns */
import { getSettings } from '../lib/sharedfunctions.js'

export async function main(ns) {
	var settingsfile = "batch/settings.txt";
	var settings = getSettings(ns, settingsfile);
	var rundata_filename = ns.args[0];
	var rundata = getSettings(ns, rundata_filename);
	var seeddatafile = "/batch/seeds/" + rundata.target + "_seeddata.txt";
	var file = getSettings(ns, seeddatafile);

	var threads = file.hackinfo.hackthreads;
	var delay = rundata.hackdelay;
	var executingserver = ns.getHostname();
	var moneylimit = file.serverstats.moneyMax * (1 - (settings.multiplier / 100));
	ns.print(moneylimit);

	if (moneylimit < file.serverstats.moneyAvailable) {
		ns.print("LIMIT: " + moneylimit);
		ns.print("CURRENT: " + file.serverstats.moneyAvailable);
		await ns.sleep(delay);
		ns.exec(settings.scripts.hackscript, executingserver, threads, rundata.target);
	}
	//ns.tprint("executing sched_hack");
}
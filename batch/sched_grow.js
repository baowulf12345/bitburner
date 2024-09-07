/** @param {NS} ns */
export async function main(ns) {
	try { var settings = JSON.parse(ns.read("batch/settings.txt")); } catch (err) { throw new Error("Problem with batch/settings.txt. Did you delete/move it?"); }
	var rundata_filename = ns.args[0];
	try { var rundata = JSON.parse(ns.read(rundata_filename)); } catch (err) { throw new Error("Something wrong with rundata. " + err.message); }
	try { var file = JSON.parse(ns.read("/batch/seeds/" + rundata.target + "_seeddata.txt")); } catch (err) { throw new Error("Something wrong with seeddata. " + err.message); }

	var threads = file.growinfo.growthreads;
	var delay = rundata.growdelay;
	var executingserver = ns.getHostname();

	await ns.sleep(delay);
	ns.exec(settings.scripts.growscript, executingserver, threads, rundata.target);
	//ns.tprint("executing sched_grow");
}
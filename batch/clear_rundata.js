/** @param {NS} ns */
export async function main(ns) {
	//ns.tail();
	// USE WITH CAUTION!!!! If you have a batchmanager running and you execute this, it'll delete the rundata and most likely the scheduler will error out.
	var rundata_files = ns.ls("home", "batch/rundata");
	for (let file of rundata_files) {
		if (file.includes("rundata")) {
			ns.print("FOUND! Removing: " + file);
			ns.rm(file, "home");
		}
	}
	var seeds = ns.ls("home", "batch/");
	for (let seed of seeds) {
		if (seed.includes("seeddata.txt")) {
			ns.print("FOUND! Removing: " + seed);
			ns.rm(seed, "home");
		}
	}
	if (ns.fileExists("batch/stats.txt", "home")) {
		ns.print("Removing batch/stats.txt");
		ns.rm("batch/stats.txt", "home");
	}
}
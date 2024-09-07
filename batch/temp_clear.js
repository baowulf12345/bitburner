/** @param {NS} ns */
export async function main(ns) {
	var rundata_files = ns.ls("home", "batch/rundata");
	for (let file of rundata_files) {
		if (file.includes("ecorp_rundata_")) {
			ns.tprint("FOUND! Removing: " + file);
			ns.rm(file, "home");
		}
	}
}
/** @param {NS} ns */
export async function main(ns) {
	//ns.tail();
	const programs = ns.singularity.getDarkwebPrograms();

	for (let program of programs) {
		var time = 10000;
		var programcost = ns.singularity.getDarkwebProgramCost(program);
		while (!(ns.fileExists(program, "home"))) {
			if (ns.getServerMoneyAvailable("home") > programcost * 2) {
				ns.tprint("buying " + program);
				ns.singularity.purchaseProgram(program);
			} else {
				ns.print("not enough money yet to buy " + program + ". Will check again in " + parseInt(time / 1000) + " seconds.");
				await ns.sleep(time);
			}
		}
	}
}
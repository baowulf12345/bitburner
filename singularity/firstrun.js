/** @param {NS} ns */
export async function main(ns) {
	//ns.tail();

	// Clear old batcher run data.
	ns.exec("/batch/clear_rundata.js","home");

	// Set sleeves to shock recovery.
	ns.exec("/sleeves/all/all_shockrecovery.js","home",1);

	// Get a job.
	if (!(ns.singularity.isBusy())) {
		ns.tprint("Going to work at Joe's Guns.");
		ns.singularity.applyToCompany("Joe's Guns", "employee");
		ns.singularity.workForCompany("Joe's Guns");
	} else {
		ns.tprint("We're already working somewhere.");
	}

	// Buy tor access.
	if ((ns.singularity.getDarkwebPrograms()).length == 0) {
		if (ns.getServerMoneyAvailable("home") > 200000) {
			ns.tprint("Buying TOR Access");
			ns.singularity.purchaseTor();
			if (!(ns.isRunning("buyprograms.js", "home"))) {
				ns.tprint("starting buyprograms.js");
				ns.exec("/singularity/buyprograms.js", "home", 1);
			}
		} else {
			while (ns.getServerMoneyAvailable("home") <= 200000) {
				await ns.sleep(10000);
			}
			ns.tprint("Buying TOR Access");
			ns.singularity.purchaseTor();
			if (!(ns.isRunning("buyprograms.js", "home"))) {
				ns.tprint("starting buyprograms.js");
				ns.exec("/singularity/buyprograms.js", "home", 1);
			}
		}
	}
}
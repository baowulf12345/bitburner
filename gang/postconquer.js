/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("sleep");
	ns.tail();
	var ganginfo = ns.gang.getGangInformation();

	// verify we're at 100% territory before running.
	while (ganginfo.territory < 1) {
		await ns.sleep(30000);
		ganginfo = ns.gang.getGangInformation();
	}

	while (ganginfo.territory == 1) {
		// if Gang Mgmt is running, kill it.
		if (ns.isRunning("gang/gangmgmt.js", "home")) {
			ns.kill("gang/gangmgmt.js", "home");
		}

		// Get a list of gang members, set the first one to Vigilante Justice and the rest to Human Trafficking.
		var gangmembers = ns.gang.getMemberNames();
		for (let member of gangmembers) {
			var memberstats = ns.gang.getMemberInformation(member);
			if (member == gangmembers[0]) {
				if (!(memberstats.task == "Vigilante Justice")) {
					ns.gang.setMemberTask(member, "Vigilante Justice");
				}
			} else {
				if (!(memberstats.task == "Human Trafficking")) {
					ns.gang.setMemberTask(member, "Human Trafficking");
				}
			}
		}
		await ns.sleep("10000");
	}
}
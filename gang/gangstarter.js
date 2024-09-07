/** @param {NS} ns */
export async function main(ns) {
	/*
	Purpose of this script is to identify if we meet the prerequisites for the Gang Management script, and if we do,
	start it.
	*/


	// Required amount of Karma before we can start a gang. Doesn't apply in the gang BitNode, so setting this as a var.
	const gang_karma = Number(-54000);

	// This is the faction we want to start a gang with. Can change this if we decide to align with a different faction,
	// however once a gang is started, you can't change until the next BitNode.
	const targetfaction = "Slum Snakes";

	// if Gang Management is already running, we'll skip this altogether.
	while (!ns.isRunning("gang/gangmgmt.js")) {

		// Collecting some info and resetting variables to false.
		var my_stats = ns.getPlayer();
		var karma = Math.ceil(Number(my_stats.karma));
		var infaction = false;
		var enoughkarma = false;
		var haveformulas = false;

		// If we're already in a gang, we can skip a lot.
		if (ns.gang.inGang()) {
			ns.print("We're already in a gang...starting Gang Manager");
			ns.exec("gang/gangmgmt.js", "home");
			break;
		} else {

			// Identify if we're a member of the target faction.
			for (let faction of my_stats.factions) {
				if (faction == targetfaction) {
					var infaction = true;
				}
			}
			if (!infaction) { ns.print("We haven't joined " + targetfaction + " yet."); }

			// Identify if we have sufficient negative karma.
			if ((karma * -1) > (gang_karma * -1)) {
				enoughkarma = true;
			} else {
				ns.print("Insufficient karma. We're only at " + karma);
			}

			// Identify if we have Formulas.
			if (ns.fileExists("Formulas.exe", "home")) {
				haveformulas = true;
			} else {
				ns.print("We don't have Formulas yet.");
			}

			// if we meet all the prerequisites, start a gang and start the Gang Manager.
			if (infaction && enoughkarma && haveformulas) {
				ns.print("prerequisites met for joining a gang!");
				ns.gang.createGang(targetfaction);
				await ns.sleep(1000);
				ns.exec("gang/gangmgmt.js", "home");
				ns.print("Gang Manager has been started!");
				break;
			} else {
				ns.print("FACTION: " + infaction + " KARMA: " + enoughkarma + " FORMULAS: " + haveformulas);
				await ns.sleep(60000);
			}
		} // if ingang
	} // while loop
	ns.print("Broken free of the loop! Gang Management has started.");
	ns.tprint("Gang Management is running, Gang Starter is closing.");
} // main
/** @param {NS} ns */
import {
	joinfaction, post
} from '../lib/sharedfunctions.js'

export async function main(ns) {
	ns.disableLog("sleep");
		// Check if we have any pending faction invitations and join them.
	while(true) {
		var pendinginvitations = ns.singularity.checkFactionInvitations();
		var factionexclusions = ['Aevum','Sector-12','Chongqing','Volhaven','Ishima','New Tokyo'];
		for (let faction of pendinginvitations) {
			if (factionexclusions.includes(faction)) {
				ns.tprint(pendinginvitations);
				continue;
			} else {
				joinfaction(ns, faction);
				post(ns, "Joining Faction " + faction);
			}
		}
		await ns.sleep(30000);
	}
}
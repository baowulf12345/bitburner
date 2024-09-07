/** @param {NS} ns */
import { getSettings,post,disableLogs } from '../lib/sharedfunctions'

export async function main(ns) {
	const settingsfile = "/jobs/settings.txt";
	const settings = getSettings(ns, settingsfile);

	const logs = ['sleep'];
	disableLogs(ns, logs);

	function getSortedHash(inputHash) {
		var resultHash = {};

		var keys = Object.keys(inputHash);
		keys.sort(function (a, b) {
			return inputHash[a] - inputHash[b]
		}).forEach(function (k) {
			resultHash[k] = inputHash[k];
		});
		return resultHash;
	}

	ns.tail();
	var companies = settings.companies;
	var repdata = {};

	// Get a list of the factions we've already joined.
	var playerfactions = ns.getPlayer().factions;

	for (let company of companies) {
		// If we've already joined the faction, we don't need to work there.
		if (playerfactions.includes(company)) {
			continue;
		} else {
			repdata[company] = {
				"rep": ns.singularity.getCompanyRep(company),
				"favor": ns.singularity.getCompanyFavor(company)
			}
		}
	}
	
	// We're sorting the factions by favor....I think.
	var sortedrepdata = getSortedHash(repdata);
	ns.tprint(sortedrepdata);

	var sleevecount = ns.sleeve.getNumSleeves();
	for (let i = 0; i < sleevecount; i++) {
		// If we already have a sleeve working for a company, let's reassign them to Idle.
		var task = ns.sleeve.getTask(i);
		if ((task) && task.type == "COMPANY") {
			ns.print("Setting sleeve " + i + " to Idle.");
			ns.sleeve.setToIdle(i);
		}
	}
	for (let j = 0; j < sleevecount; j++) {
		var targetcompany = Object.keys(sortedrepdata)[0];
		ns.print("setting sleeve " + j + " to work at " + targetcompany);
		ns.sleeve.setToCompanyWork(j, targetcompany);
		delete sortedrepdata[targetcompany];
	}
}
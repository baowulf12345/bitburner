/** @param {NS} ns */
import { getSettings, post } from '../lib/sharedfunctions.js'

export async function main(ns) {
	ns.tail();
	ns.disableLog("sleep");
	if (ns.args[0]) {
		var desiredrole = ns.args[0];
	} else {
		var desiredrole = "IT";
	}
	while (true) {
		// Run getjobinfo to create the info & companies txt files, if they don't already exist.
		if (!(ns.fileExists("/jobs/settings.txt", "home"))) {
			ns.exec("/jobs/getjobinfo.js", "home", 1);
			await ns.sleep(500);
		}

		const settingsfile = "jobs/settings.txt";
		const settings = getSettings(ns, settingsfile);

		settings["role"] = desiredrole;
		var jobinfo = settings.jobinfo;
		var companies = settings.companies;

		//get player info.
		var player = ns.getPlayer();

		function checkjobs(company) {
			var playerjobs = ns.getPlayer().jobs;
			if (playerjobs[company]) {
				return true;
			} else {
				return false;
			}
		}

		function checkrole(jobinfo, company, jobtitle) {
			var player = ns.getPlayer();
			var currentrep = ns.singularity.getCompanyRep(company);

			// Get next job info.
			var roledata = jobinfo[company][jobtitle];
			if (!(roledata) || roledata == "null") {
				return false;
			}
			var rolerequiredrep = roledata["requiredReputation"];
			var rolerequiredskills = roledata["requiredSkills"];
			ns.print("Next position with " + company + " min rep: " + rolerequiredrep);
			ns.print("Next position with " + company + " min skills: " + JSON.stringify(rolerequiredskills));

			var ready = {};

			// skills check.
			for (let key of Object.keys(rolerequiredskills)) {
				//ns.tprint(rolerequiredskills[key]);
				if (player.skills[key] > rolerequiredskills[key]) {
					ready[key] = true;
				} else {
					ready[key] = false;
				}
			}

			// rep check.
			if (currentrep >= rolerequiredrep) {
				ready["rep"] = true;
			} else {
				ready["rep"] = false;
			}
			//ns.tprint("REP CHECK: " + ready["rep"]);

			// return status.
			var readystatus = true;
			for (let readykeys of Object.keys(ready)) {
				if (ready[readykeys] == false) {
					readystatus = false;
				}
			}
			return readystatus;
		}


		// Iterate through companies to determine if we're currently working for them, and if we are check if we can promote.
		for (let company of companies) {
			var alreadyworking = checkjobs(company);
			if (alreadyworking) {
				ns.print("Already working for " + company + "; Current Role: " + player.jobs[company]);

				// Get current job info.
				var currentroledata = jobinfo[company][player.jobs[company]];
				//ns.print(currentroledata);

				// Get next job name.
				var nextrolename = jobinfo[company][player.jobs[company]]["nextPosition"];
				//ns.tprint("next position data: " + JSON.stringify(jobinfo[company][nextrolename]));

				// Check if we're ready for next job.
				if (nextrolename) {
					var promotionready = checkrole(jobinfo, company, nextrolename);
					ns.print("PROMOTIONREADY: " + promotionready);
					if (promotionready) {
						var promote = ns.singularity.applyToCompany(company, currentroledata["field"]);
						ns.print("PROMOTION STATUS: " + promote);
						ns.toast("Promoted to " + nextrolename + " at " + company);
					}
				} else {
					ns.print("Next suggested role for " + company + " is null.");
					continue;
				}
			} else {
				// get available positions for the company.
				var possibleroles = jobinfo[company];
				for (let rolekeys of Object.keys(possibleroles)) {
					if (possibleroles[rolekeys]["field"] == desiredrole && possibleroles[rolekeys]["requiredReputation"] == 0) {
						ns.print("Checking if we are ready for " + possibleroles[rolekeys]["name"] + " at " + company);
						var applyready = checkrole(jobinfo, company, possibleroles[rolekeys]["name"]);
						if (applyready) {
							var apply = ns.singularity.applyToCompany(company, desiredrole);
							ns.toast("Applied for a security role at " + company + ". Result: " + apply);
						} else {
							ns.print("Not ready for job at " + company + ": " + applyready);
						}
					}
				}
			}
		}
		await ns.sleep(30000);
	} // end while loop.
}
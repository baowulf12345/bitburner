/** @param {NS} ns */
export async function main(ns) {
	try { var settings = JSON.parse(ns.read("batch/settings.txt")); } catch (err) { throw new Error("Problem with batch/settings.txt. Did you delete/move it?"); }
	if (settings.overridetarget == "true") {
		ns.print("target override from settings: " + settings.newtarget);
		var target = settings.newtarget;
	} else {
		var target = ns.args[0];
	}
	if (ns.fileExists("batch/seeds/" + target + "_seeddata.txt", "home")) {
		try { var seeddata = JSON.parse(ns.read("batch/seeds/" + target + "_seeddata.txt")); } catch (err) { throw new Error("Problem with /batch/seeds/" + target + "_seeddata.txt. Did you delete/move it?"); }
		var settings = seeddata["settings"];
		var delay = settings.delay;
	} else {
		throw new Error("Seed data doesn't exist. Verify.");
	}

	ns.print("Scheduler kicked off! Targeting: " + target + " with " + delay + " delay.");

	function saveRunData(executingserver, rundata_filename) {
		if (!(executingserver == "home")) {
			if (ns.fileExists(rundata_filename, "home")) {
				ns.rm(rundata_filename, "home");
			}
			ns.scp(rundata_filename, "home", executingserver);
		}
	}

	var executingserver = ns.getHostname();
	var starttime = Date.now();
	var rundata = {};
	var rundata_filename = "/batch/rundata/" + target + "_rundata_" + starttime + ".txt";

	rundata["target"] = target;
	rundata["loopstarttime"] = starttime;
	rundata["preparer"] = false;

	// Estimated end times.
	rundata["weakenendtime"] = starttime + seeddata.weakeninfo.weakentime;
	rundata["growendtime"] = starttime + seeddata.growinfo.growtime + delay;
	rundata["hackendtime"] = starttime + seeddata.hackinfo.hacktime + (delay * 2);

	// delays.
	rundata["weakendelay"] = 0;
	rundata["growdelay"] = seeddata.weakeninfo.weakentime - seeddata.growinfo.growtime + delay;
	rundata["hackdelay"] = seeddata.weakeninfo.weakentime - seeddata.hackinfo.hacktime + (delay * 2);


	// Start weaken.
	var weakenrun = ns.exec(settings.scripts.sched_weaken, executingserver, 1, rundata_filename);
	rundata["weakenpid"] = weakenrun;
	rundata["weakenstarttime"] = Date.now();
	ns.write(rundata_filename, JSON.stringify(rundata, null, 2), "w");
	saveRunData(executingserver,rundata_filename);

	//Start grow.
	var growrun = ns.exec(settings.scripts.sched_grow, executingserver, 1, rundata_filename);
	rundata["growpid"] = growrun;
	rundata["growstarttime"] = Date.now();
	ns.write(rundata_filename, JSON.stringify(rundata, null, 2), "w");
	saveRunData(executingserver,rundata_filename);

	//Start hack.
	var hackrun = ns.exec(settings.scripts.sched_hack, executingserver, 1, rundata_filename);
	rundata["hackpid"] = hackrun;
	rundata["hackstarttime"] = Date.now();
	ns.write(rundata_filename, JSON.stringify(rundata, null, 2), "w");
	saveRunData(executingserver,rundata_filename);

	//We're going to wait until this batch is complete, wait a couple more seconds, then delete the rundata file.
	await ns.sleep(seeddata.weakeninfo.weakentime + 2000);
	ns.rm(rundata_filename, "home");
	if (!(executingserver == "home")) {
		ns.rm(rundata_filename,executingserver);
	}
}
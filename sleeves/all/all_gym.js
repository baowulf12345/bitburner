/** @param {NS} ns */
export async function main(ns) {
	ns.tail();
	ns.disableLog("sleep");
	const numsleeves = ns.sleeve.getNumSleeves();
	const gym = "Powerhouse Gym";
	const city = "Sector-12";
	var goodsleeves = 0;
	while (goodsleeves < numsleeves) {
		var goodsleeves = 0;
		for (let i = 0; i < numsleeves; i++) {

			var sleevestats = ns.sleeve.getSleeve(i).skills;
			var lowvalue = 1e12;
			var lowskill = "";
			for (let skill of Object.keys(sleevestats)) {

				if (skill == "intelligence") { continue; }
				if (skill == "hacking") { continue; }
				if (skill == "charisma") { continue; }
				if (sleevestats[skill] < lowvalue) {
					lowvalue = sleevestats[skill];
					lowskill = skill;
				}
			}
			//ns.print("sleeve " + i + " low skill: " + sleevestats[lowskill] + "(" + lowvalue + ")");
			if (sleevestats[lowskill] < 850) {
				if (ns.sleeve.getSleeve(i).city !== city) {
					ns.print("sleeve " + i + " is in the wrong city. Moving to " + city);
					ns.sleeve.travel(i, city);
				}
				ns.print("Setting sleeve " + i + " to work on " + lowskill + " at " + gym + "(" + lowvalue + ")");
				ns.sleeve.setToGymWorkout(i, gym, lowskill);
			} else {
				goodsleeves++;
			}
		}
		await ns.sleep(30000);
	}
}
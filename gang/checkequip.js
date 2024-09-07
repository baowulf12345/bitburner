/** @param {NS} ns */
export async function main(ns) {
	function getDiscount() {
		const power = ns.gang.getGangInformation().power;
		const respect = ns.gang.getGangInformation().respect;

		const respectLinearFac = 5e6;
		const powerLinearFac = 1e6;
		const discount =
			Math.pow(respect, 0.01) + respect / respectLinearFac + Math.pow(power, 0.01) + power / powerLinearFac - 1;
		return 1 / Math.max(1, discount);
	}
	ns.disableLog("sleep");

	ns.tail();
	while (true) {

		try { var settings = JSON.parse(ns.read("gang/settings.txt")); } catch (err) { throw new Error("Problem with gang/settings.txt. Did you delete/move it?"); }

		// This is the discounted price target. 0.8 = 20% discount.
		var targetdiscount = settings.equipment.targetdiscount;

		// This is the percent of player money to spend on upgrades. If an upgrade costs more than this, don't buy it.
		// adjust the static float in settings to modify the available money.
		var mymoney = ns.getPlayer().money * settings.equipment.maxpercentofmoney;

		var discountedrate = getDiscount();
		var equipment = ns.gang.getEquipmentNames();
		//ns.tprint(discountedrate);
		var members = ns.gang.getMemberNames();
		if (discountedrate < targetdiscount) {
			for (let member of members) {
				var membergear = ns.gang.getMemberInformation(member).upgrades;
				for (let upgrade of equipment) {
					if (membergear.includes(upgrade)) {
						continue;
					} else {
						var price = ns.gang.getEquipmentCost(upgrade);
						if (price < mymoney) {
							ns.print("purchasing " + upgrade + " for " + member);
							ns.gang.purchaseEquipment(member, upgrade);
						}
					}
				}
			}
		}
		await ns.sleep(120000);
	}
}
/** @param {NS} ns */
export async function main(ns) {
	// Array of the companies with factions.
	var companies = ['KuaiGong International', 'ECorp', 'MegaCorp', 'Four Sigma', 'NWO', 'Blade Industries', 'OmniTek Incorporated', 'Bachman & Associates',
		'Clarke Incorporated', 'Fulcrum Technologies']

	var details = {};
	for (let company of companies) {
		var availpositions = ns.singularity.getCompanyPositions(company);
		var positions = {};
		for (let position of availpositions) {
			var posinfo = ns.singularity.getCompanyPositionInfo(company, position);
			positions[position] = posinfo;
		}
		details[company] = positions;
	}
	var settings = {};
	settings["companies"] = companies;
	settings["jobinfo"] = details;
	ns.write("/jobs/companies.txt",JSON.stringify(companies,null,2),"w");
	ns.write("/jobs/jobinfo.txt",JSON.stringify(details,null,2),"w");
	ns.write("/jobs/settings.txt",JSON.stringify(settings,null,2),"w");
}
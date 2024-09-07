# bitburner
Scripts for the game Bitburner 


// In a fresh bitnode, I'll run hacknet/onlymoney.js since I have BN9.3 which gives me a default hacknet server that can net me a cool million within the first few seconds.

// after that, I stole alainbryden's casino.js script, so I'll run that to get up to 10B.

// Next, I'll run "onboard.js". This will kick off a bunch of other things and get our first servers onboarded.

// Among the items kicked off is monitorV3.js, which provides a status update on available targets every 2 minutes.
// This script will also monitor our stats and other conditions, and kick off subordinate managers based on certain things, like triggering the gang manager script when we exceed -54K karma.

// The Bitburner guide (https://bitburner.readthedocs.io/en/latest/advancedgameplay/hackingalgorithms.html) describes 4 kinds of hacking algorithms:
 * self-contained algorithms (the arg_target.js scripts)
 * loop algorithms (I don't have one of these in this repo)
 * hacking managers (manager/manager.js)
 * batch algorithms (batch/manager.js)

// local/run_locals.js <X> will calculate how much RAM you have and trigger multple self-contained algorithm scripts on X number of targets that are eligible for hacking based on your current hacking level. Ex. I have 150 hacking level, and I run "local/run_locals.js 3". If I have, say, 32768 RAM, It'll assign 32768/5/3/2.4 = ~910 threads to 5 instances of arg_target.js against silver-helix, 5 more against phantasy, and 5 more against iron-gym. That's 15 arg_target.js scripts kicked off. These will have collisions a lot, but in general, i find it effective if I have insufficient RAM for the manager or batch scripts. run_locals.js won't kick off if the resulting number of threads is too low to be meaningful.

// manager/manager.js can be used to run a "Manager" style hack against a target. This will spawn H/G/W scripts one at a time with the appropriate number of threads to achieve a desired result. With sufficient RAM, you can run several of these in parallel against different targets, and they'll work just fine. 

// batch/manager.js is the batch script. This does a lot of stuff, but the long-and-short of it is, it executes standalone h/g/w tasks against a specified host, repeatedly, until you run out of ram. It'll wait until these all complete, then start again. These h/g/w scripts will land on the target at an interval dictated in the batch/settings.txt file, which I think is set to 20ms by default (check default/batch/settings.txt). Ex. I run batch/manager.js n00dles with 2PB of RAM, it'll try to consume all the RAM I have available while repeatedly launching w/g/w/h against n00dles, trying to claw out a certain % of money (also dicated by the settings file).


// I find manager/manager.js to be more efficient than local/run_locals.js when I'm starting a fresh bitnode, but once I have in excess of 65536 home RAM, run_locals is more profitable. Once I exceed 262144 RAM on home, batch/manager.js can really go ham. I typically target phantasy first. then after a reset or two, I'll target silver-helix or catalyst depending on how significantly my hacking level has grown and the weaken time needed. Once ecorp's weaken time is under 10 minutes, I start targeting that.

// Keep in mind that hacknet/manager.js will pay attention to whether or not batch/manager.js is running. if it is, it'll start using hashes to reduce the minimum security level/maximum money on the server targeted by the batch script. This will make the batched h/w/g/w events "cast" faster, as well as net more money each time. Well worth it.
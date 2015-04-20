ita-matrix-powertools
=====================
Script for greasemonkey + ITA Matrix

Main discussion here:

http://www.flyertalk.com/forum/travel-tools/1623427-ita-purchase-fares-orbitz-delta-userscript.html

***** Notice: *****

!!! Double check your chosen flights before purchasing !!!

***** Usage: *****

Use either the install the script into your preferred script manager or copy the the RAW-Text into your debug console.
Using debug console, you may use the shortened minifed version.
(Note: there is no need to reexecute the script on pagechange unless you reloaded the page)

***** Files: *****

ita-matrix-powertools.user.js -- Main userscript, install into Greasemonkey/etc but also usable in debug console.

script_minified.txt --  Compact , pastable version of the script for pasting in the debug console.

*********** Latest Changes **************

**** Version 0.11 ****

2015-04-19 Edited by Steppo (added SeatGuru,
                                added Planefinder,
                                moved translation to external var/function adding capability to add translations,
                                added possibility to print notifications,
                                added self-test to prevent crashing on class-changes,
                                set timeout of resultpage to 10s,
                                added powerfull selector-function to get desired td in itin => see findItinTarget,
                                moved exit in frames to top,
                                some cleanups,
                                moved older changelogitems to seprate file on GitHub)
                                
**** Version 0.10a ****

2015-04-05 Edited by RizwanK (Attempted to merge functionality from .user. and .console. into one file)

**** Version 0.10 ****

2015-03-31 Edited by IAkH/Steppo (Adapted to new classes)

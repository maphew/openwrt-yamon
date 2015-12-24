This fork was initially started from https://github.com/jlhughes/openwrt-yamon, which in turn is a fork from http://usage-monitoring.com/. 

The real development on YAMon2 happens at http://www.dd-wrt.com/phpBB2/viewtopic.php?t=259806. 

I started here on Github because I just can't wrap my head around how forums work effectively; so noisy and hard to track what's going on (for me). Jlhughes had the most active yamon2 on Github so I stood on that first. Now that I'm more familiar with the project I think it would have been better to start fresh, as I've deviated quite a bit from Joel's start and the name doesn't really fit, but that's not what happened. {shrug}

Differences from @jlhughes:
 
 - revert to stock upstream
 - upgrade to v2.3.0

Differences from stock upstream:

 - Moving firmware specific commands and variables into include files (`includes/firmware/$name`). A work in progress, see Issue #9.
 - Add [padavan](https://bitbucket.org/padavan/rt-n56u/src) firmware specifics (Todo) 

---
_I'll be making heaps of mistakes. I'm not a 'nix shell programmer, or any kind of programmer really, but I like hacking on stuff and learning. I have a strong personal itch to know what's going on in my household in terms of bandwidth usage and this project has been the best fit I could find for getting there._

_Maybe some of this will be useful to you too._

_Cheers,_

_-- Matt_
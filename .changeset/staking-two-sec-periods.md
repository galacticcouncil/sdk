---
'@galacticcouncil/sdk-next': patch
---

Staking period numbers account for the 6s→2s block-time switch. The wasm
calculate_period_number only knows the 12s→6s anchor and would count 2s
blocks with 6s-era weight (periods accruing 3× too fast, overstating the
payable percentage). Periods are now computed by an exact TypeScript port
of the 4-arg runtime math, anchored on Staking.SixSecBlocksSince and
Parameters.TwoSecBlocksSince (u32::MAX sentinel pre-switch keeps behaviour
bit-identical on 6s runtimes).

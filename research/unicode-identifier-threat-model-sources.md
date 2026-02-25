# unicode-identifier-threat-model.mdx: claim-evidence table

Private reference file. Not published.

| Claim | Evidence Source |
|-------|---------------|
| Spotify account hijacking via Unicode small capitals (June 2013) | https://engineering.atspotify.com/2013/06/creative-usernames |
| Attacker used Latin small capitals (U+1D2E, U+1D35, etc.) | Spotify blog: `u'\u1d2e\u1d35\u1d33\u1d2e\u1d35\u1d3f\u1d30'` |
| `nodeprep.prepare()` was not idempotent after Python library upgrade | Spotify blog: "Twisted's implementation of nodeprep.prepare() to behave incorrectly" |
| Python 2.4 to 2.5 upgrade changed `unicodedata` handling | Spotify blog: explicit statement |
| Password reset for attacker's account resolved to victim's | Spotify blog: canonicalisation applied twice produced different results |
| Trojan Source disclosed by Boucher and Anderson | https://trojansource.codes/ |
| CVE-2021-42574: bidi manipulation | https://nvd.nist.gov/vuln/detail/CVE-2021-42574 |
| CVE-2021-42694: homoglyph identifier substitution | https://nvd.nist.gov/vuln/detail/CVE-2021-42694 |
| confusables.txt maps 6,565 characters | Verified: `curl -sL https://unicode.org/Public/security/latest/confusables.txt | grep -v '^#' | grep -v '^$' | wc -l` returns 6565 (Unicode 16.0) |
| TR39 skeleton algorithm: NFD, remove ignorables, map prototypes, NFD | UTS #39 Section 4; deep-research-report.md line ~37 |
| confusables.txt maps individual characters, not sequences (rn/m outside scope) | UTS #39 Section 4 defines skeleton as per-character mapping; deep-research-report.md skeleton limitations |
| Zero-width space (U+200B) and soft hyphens (U+00AD) are default-ignorable | Unicode Standard DerivedCoreProperties.txt: Default_Ignorable_Code_Point property |
| Bidi overrides (U+202A-U+202E, U+2066-U+2069) | Unicode Standard, Chapter 9; Trojan Source paper |
| Trojan Source demonstrated bidi attacks in source code | https://trojansource.codes/; CVE-2021-42574 |
| Combining mark stacking can obscure base character identity | deep-research-report(1).md combining mark evasion discussion |
| NFKC maps Long S (U+017F) to "s", TR39 maps to "f" | unicode-confusables-nfkc-conflict.mdx; verified against confusables.txt and NFKC spec |
| Mathematical Bold I (U+1D408): TR39 maps to "l", NFKC maps to "I" | unicode-confusables-nfkc-conflict.mdx; verified against data |
| 31 characters where NFKC and TR39 disagree | unicode-confusables-nfkc-conflict.mdx; namespace-guard generate-confusables.ts output |
| ſteve example: NFKC-first detects collision with "steve", TR39 skeleton produces "fteve" | confusable-detection-without-nfkc.mdx lines 129-135 |
| Survey of twelve systems: none chains NFKC into confusable lookup | confusable-detection-without-nfkc.mdx; tables at lines 32-58 |
| Five use NFD, one uses NFC, four use no normalisation, two hybrid | confusable-detection-without-nfkc.mdx survey tables |
| ICU SpoofChecker uses NFD | ICU docs: https://unicode-org.github.io/icu-docs/apidoc/dev/icu4c/uspoof_8h.html; deep-research-report.md |
| Chromium thirteen-step IDN policy | https://alephsecurity.com/2020/07/23/revised-homograph-attacks2/; Chromium source idn_spoof_checker.cc |
| Rust chose NFC over NFKC deliberately | https://rust-lang.github.io/rfcs/2457-non-ascii-idents.html; confusable-detection-without-nfkc.mdx |
| django-registration uses confusable_homoglyphs with no normalisation | confusable-detection-without-nfkc.mdx lines 80-85 |
| No published benchmark corpus for Unicode identifier spoofing | namespace-guard-update-since-launch.md; deep-research-report(1).md benchmark design discussion (no prior art cited). Nearest prior art: GlyphNet (arxiv.org/abs/2306.10392) is 4M rendered domain-name images for homograph detection (binary, domain-specific, image-based). Does not cover identifiers broadly, invisible chars, canonicalisation mismatches, or labelled threat classes. |
| confusable-bench.v1: 140 rows, 120 malicious, 20 benign | namespace-guard docs/data/confusable-bench.v1.json (verified: 140 array entries) |
| Four threat classes: composability, impersonation, evasion, benign | namespace-guard-update-since-launch.md; verified against JSON data |
| attack-gen CLI command exists | namespace-guard src/cli.ts line 25 |
| calibrate CLI command with cost-aware optimisation | namespace-guard src/cli.ts lines 27, 46-51 |
| drift CLI command for composability vector regression | namespace-guard src/cli.ts line 29 |
| drift exits non-zero on detected changes | namespace-guard src/cli.ts (exit code logic in drift command handler) |
| CONFUSABLE_MAP: 613 entries (NFKC-filtered) | namespace-guard src/index.ts line 1077 |
| CONFUSABLE_MAP_FULL: ~1,400 entries (unfiltered) | namespace-guard src/index.ts line 1333 (1425 entries) |
| skeleton() and areConfusable() implement TR39 Section 4 | namespace-guard src/index.ts lines 2631, 2795 |
| Invisible character validator: default-ignorables and bidi controls | namespace-guard src/index.ts line 2430 (createInvisibleCharacterValidator) |
| UTS #39: skeleton mechanism "overly inclusive", closeness metric possible | UTS #39; deep-research-report.md line 41-42; deep-research-report(2).md line 22 |
| Font-rendering attacks out of scope for Unicode-data approaches | deep-research-report(1).md; UTS #39 does not address rendered similarity |
| ML-driven homoglyph discovery from glyph images | deep-research-report(2).md lines 69-70 (character embedding discovery) |
| PRI #540 submitted for Unicode public review | namespace-guard README.md line 69; https://www.unicode.org/review/pri540/ |
| namespace-guard v0.15.1, zero dependencies, MIT licence | namespace-guard package.json line 3 (version), line 8 (license) |

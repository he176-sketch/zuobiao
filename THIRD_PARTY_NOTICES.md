# Knowledge sources and reuse

This release imports selected data and documentation, with no new runtime or global skill dependency. The existing 12-question discovery flow remains an editorial reading aid; it does not use third-party scores or claim psychometric validation.

## Philoscopia

- Author: Fabrice Gallet, https://github.com/fbgallet/philoscopia-open
- Pinned revision: `92b206c0c86cb93c377d34b0fdfc2aa7cd0821ef`
- Selected originals: `vendor/philoscopia/data/` (three movements and Camus)
- Original license: `vendor/philoscopia/LICENSE`, CC BY-SA 4.0
- Chinese adaptations: `public/knowledge/philosophy-lenses.json`, also CC BY-SA 4.0
- Changes by Zuobiao: selected eight positions, paraphrased into Chinese, added practical tradeoffs and references checked against original works or scholarly encyclopedias. Original bibliography is retained as upstream bibliography, not a claim that every listed work was directly reviewed. No upstream scores are used. `EXPLICIT` / `INFERABLE` are editorial labels; the upstream files are not validated assessments.

Attribution and the license are displayed with the materials. The adapted dataset and full license can be downloaded from the app. This license covers the adapted content, not the independent application code.

## Model Thinking

- Copyright (c) 2026 KC Chien, https://github.com/kcchien/model-thinking
- Pinned revision: `c4027bedca713d9ace86032f94a4a2dba299385c`
- Selected originals: `vendor/model-thinking/references/` (economics, decisions, statistics, learning)
- Original license: `vendor/model-thinking/LICENSE`, MIT
- Adapted six-card dataset: `public/knowledge/thinking-tools.json`, MIT
- Changes by Zuobiao: simplified Chinese living examples, questions, boundaries, and additional primary-source links. These are decision aids, not a validated psychological intervention. The small-experiment card retains the limited-testing method and does not claim that adversity necessarily improves people.

The original copyright and full permission notice are retained in the app at `public/knowledge/licenses/model-thinking.txt`.

## Scope and verification

The files in `vendor/knowledge-manifest.json` have pinned raw-source URLs and SHA-256 hashes, checked by the test suite. The app uses only curated data; it does not execute upstream instructions or send data to these repositories. External books, papers, and encyclopedias are linked for verification, not included as freely licensed full texts.

Current source selection follows the user's confirmed philosophy. An optional tool helps structure reasoning and cannot change the base or save principles. Responses must cite at least one active foundation source. Material snapshots retain the selected tool, content, attribution, and license across later choices and exports.

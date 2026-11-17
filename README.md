# The Upper Room Collective — website

Astro static site. Rules for anyone (human or Claude) changing it are in [CLAUDE.md](CLAUDE.md).

## Quick start
```bash
npm install
npm run dev       # http://localhost:4321
npm run verify    # type check + style lint + production build
```

## Editing text
Most copy lives in `src/content/*.yaml`. Change the words, keep the indentation. If something is wrong (a missing field, alt text, a title that's too long), the build stops and tells you which file and line.

## Design system
See `/styleguide` on any preview, and `src/styles/tokens.css`.

## Status
- Home page rebuilt on the new design system. Other pages still exist only as reference in `reference/legacy-site/`, pending new layouts.
- Images are placeholders.
- Forms are not connected yet.
- Domain not decided; search engines are blocked until launch (`BLOCK_INDEXING`).

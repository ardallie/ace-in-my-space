# Stack profile grammar

The form of a repository's stack profile: the related repositories of one application, with where each sits and how it relates to this one. This file describes the form and is never itself read as a profile.

## Location and ownership

- `.profile/stack.profile.md` at the top of the repository's git work tree.
- One copy per repository, each summary written from its own repository's point of view.
- Maintained by the owner. No skill writes it; committing it is the owner's choice.
- Read by `$ace:scope-consultant` to resolve a round's target, and by `$ace:scope-envelope` and `$ace:scope-review` only to fill a printed round line's `--target`. It is never evidence about a sibling.

## Form

Copy the block below into `.profile/stack.profile.md`, then replace the names, paths, addresses and summaries with your own:

```
# Stack profile

{Optional preamble: anything before the first entry is ignored.}

## web-client (this repository)
Local project: ~/Projects/web-client
GitHub: https://github.com/{owner}/web-client
{What this repository is, in one or two lines.}

## service-api
Local project: ~/Projects/service-api
GitHub: https://github.com/{owner}/service-api
{How it relates to this repository: what it provides, and what this repository calls or serves.}
```

## Reading rules

- Each line starting `## ` opens an entry. The text after it, trimmed, is the entry's name.
- A trailing ` (this repository)`, matched ignoring case, is the marker and not part of the name.
- Within an entry:
  - the first `Local project:` line gives its path;
  - the first `GitHub:` line gives its address, which is descriptive only and decides nothing;
  - every other non-blank line, a line holding another `Field:` included, is the summary.
- A path is absolute (`/...`, `C:/...`, `C:\...`), `~/`-prefixed (expanded by the reading skill to the user's home directory), or relative to the repository's root.

## Malformed

A profile is malformed when it has:
- no entry;
- no entry marked, or more than one;
- two names equal ignoring case;
- an entry with no `Local project:` line;
- a marked entry whose path is not this repository's root, which is how an unedited copy from a sibling shows.

A malformed profile stops a run only where the run depends on it: a `--target` naming an entry, or no `--target`.

## Matching

- A `--target` name matches an entry's name ignoring case, the marker excluded, and exactly one entry must match.
- There is no partial, slug, folder-name or GitHub-name match.
- Paths are compared ignoring case, with `\` and `/` alike and any trailing separator dropped.
- A URL is never a target.

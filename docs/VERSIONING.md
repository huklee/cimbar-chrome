# Versioning policy

This project uses Semantic Versioning (`MAJOR.MINOR.PATCH`) for extension releases.
The version in `package.json` and `extension/manifest.json` must always match.

## Version increments

- **MAJOR**: incompatible behavior, removal of a documented feature, or a stored-draft migration that cannot preserve existing user data.
- **MINOR**: backward-compatible features, new controls, supported formats, or substantial workflow additions.
- **PATCH**: backward-compatible bug fixes, security fixes, documentation corrections, and internal test or build improvements.

The undercover ZIP mode is version `1.1.0` because it adds a new default workflow while retaining the existing transfer feature after unlock.

## Chrome version format

Chrome extension manifests accept one to four dot-separated numeric components. Release versions therefore use numeric `MAJOR.MINOR.PATCH` values in the manifest and do not use SemVer prerelease suffixes there. Experimental builds may use a fourth numeric component locally, but published Git tags use three components.

## Release procedure

1. Choose the increment from the rules above.
2. Update `package.json` and `extension/manifest.json` to the same version.
3. Update user-facing documentation and `docs/JOBS.md` for the release.
4. Run `npm test`, `npm run check`, `npm run test:browser`, and `npm run package`.
5. Merge the reviewed pull request into the default branch only after CI passes.
6. Create an annotated `vMAJOR.MINOR.PATCH` tag from the merge commit when publishing a release.

Never reuse or move a published version tag. If a release needs correction, publish a new PATCH version.

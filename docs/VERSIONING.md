# Versioning and release policy

- Target: Semantic Versioning (`MAJOR.MINOR.PATCH`).
- Until `v1.0.0`, public APIs and configuration may change between minor releases.
- `v0.0.0` indicates project foundation and planning, **not a runnable release**.
- Release only when code and reproducible tests support the advertised functionality.
- Each release must have a Git tag (`vX.Y.Z`), release notes, supported Windows/Linux and tool versions, migration notes and known limitations.
- Use feature branches and pull requests; document architecture choices as ADRs.
- Track implementation using GitHub Issues; close only after test evidence.
- Update `CHANGELOG.md`, `ROADMAP.md` and `docs/STATUS.md` together before any release.

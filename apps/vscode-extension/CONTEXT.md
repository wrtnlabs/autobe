# VSCode Extension Context

## Dependency Issues

### vsce pack Error
- When packages are in `dependencies`, `vsce pack` may fail during the packaging process.
- This is because VSCode extensions do not use external packages, and therefore require bundling.

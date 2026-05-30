# Update Claude Code CLI

Uninstall the current global `@anthropic-ai/claude-code` and reinstall a specific version.

## Parameters

- `$ARGUMENTS` — The target version to install. Defaults to `2.1.153` if not provided.

## Steps

Determine the target version:

- If `$ARGUMENTS` is provided and non-empty, use it as the version.
- Otherwise, use `2.1.153`.

Run the following two commands sequentially:

```bash
npm uninstall -g @anthropic-ai/claude-code && npm install -g @anthropic-ai/claude-code@<version>
```

After installation, verify the version:

```bash
claude --version
```

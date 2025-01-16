# action-roblox-luau-workflow

## Example workflow

```yaml
name: Execute Luau Script
on:
  push:
    branches:
      - main

jobs:
  execute-luau:
    runs-on: ubuntu-24.04
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Execute script
        uses: grand-hawk/action-roblox-luau-execution@0.1.0
        with:
          roblox_api_key: ${{ secrets.ROBLOX_API_KEY }}
          universe_id: '123456789'
          place_id: '987654321'
          luau_file: 'path/to/script.luau'
          output_file: 'path/to/output.txt' # optional
          dump_to_summary: true # optional
```

## サブモジュール追加
```SH
git submodule add https://github.com/tomo-x7/shared shared
```
## biome.json
```JSONC
{
	"$schema": "https://biomejs.dev/schemas/2.2.3/schema.json",
	"extends": ["./shared/biome.jsonc"]
}

```

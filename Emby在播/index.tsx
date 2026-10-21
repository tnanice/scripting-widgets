import { Widget, Script } from "scripting"

async function main() {
  await Widget.preview({ family: "systemMedium" })
  Widget.reloadAll()
  Script.exit()
}

main()

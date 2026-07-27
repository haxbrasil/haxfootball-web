import type { Room } from "@haxbrasil/haxfootball-api-sdk";

export function roomDisplayName(room: Room): string {
  const configuredName = room.launchConfig.roomName;

  if (typeof configuredName === "string" && configuredName.trim()) {
    return configuredName.trim();
  }

  return room.program.title?.trim() || room.program.name || room.id;
}

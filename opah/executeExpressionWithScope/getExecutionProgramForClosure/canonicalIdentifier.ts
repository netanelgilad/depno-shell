import { CanonicalName } from "@opah/core";

function sanitizeURI(uri: string) {
  return uri
    .replace(/_/g, "$_")
    .replace(/\//g, "$__")
    .replace(/\./g, "$___")
    .replace(/@/g, "$____")
    .replace(/:/g, "$_____")
    .replace(/-/g, "$______");
}

const separator = "$$$";

export function canonicalIdentifier(name: CanonicalName) {
  return `${sanitizeURI(name.uri)}${separator}${name.name}`;
}

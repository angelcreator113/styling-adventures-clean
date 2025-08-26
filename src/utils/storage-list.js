const isPrimaryObject = (obj) => {
  const meta = obj.metadata || {};
  const v = meta.customMetadata?.variant;
  if (v) return v === "primary";

  // filename fallback if metadata isn’t present
  const name = obj.name.toLowerCase();
  return !(
    name.includes("preview") ||
    name.includes("iconhover") ||
    name.includes("icon-hover") ||
    name.endsWith("-icon.png") ||
    name.endsWith("-iconhover.png")
  );
};

const primaryOnly = allObjects.filter(isPrimaryObject);

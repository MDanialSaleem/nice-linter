import colors from "colors";

// utility functions.
export const prettyPrint = (obj, coloringFunction = colors.white) =>
  console.log(coloringFunction(JSON.stringify(obj, null, 2)));

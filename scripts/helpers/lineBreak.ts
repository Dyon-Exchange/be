/**
 * Prints a linebreak with some extra spacing - formats the console logs so they are more readable
 * @param {boolean} isEnd Whether the line break signifies the beginning or ending of a block  of text
 */
export const lineBreak = (isEnd: boolean): void => {
  if (!isEnd) {
    console.log("=========================");
  }
  console.log("");
  console.log("");
  console.log("");
  if (isEnd) {
    console.log("=========================");
  }
};

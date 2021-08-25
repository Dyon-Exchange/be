/**
 * caseId needs to be incremented and placed in an 8 character string. This function accomplishes that.
 * @param {string} price
 */
export const formatCaseId = (caseId: number): string => {
  let zeros = "0000000";
  if (Math.floor(caseId / 10) > 0) zeros = "000000";
  if (Math.floor(caseId / 100) > 0) zeros = "00000";
  return `${zeros}${caseId.toString()}`;
};

/**
 * Data comes from a json file modified from a CSV. The price comes in a human readable format unsuitable for consumption by the populateDb script. This function formats the received price field such that it is.
 * @param {string} price
 */
export const formatPriceString = (priceUnformatted: string): number => {
  const priceArr = priceUnformatted.split(" ");
  let priceStr = priceArr[1];
  priceStr = priceStr.replace(",", "");
  return Number(priceStr);
};

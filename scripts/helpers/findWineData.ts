import wines from "../data/wines.json";
import { filter } from "lodash";

type Wine = typeof wines[0];

export const findWineData = (productIdentifer: string): Wine =>
  filter(wines, (wine) => wine.LWIN === productIdentifer)[0];

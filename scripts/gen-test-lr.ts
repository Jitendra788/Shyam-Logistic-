import { writeFileSync, readFileSync } from "fs";
import { buildLrPdf } from "../src/lib/tbs/lrPdf";

async function main() {
  const bookings = JSON.parse(readFileSync("./data/tbs/bookings.json", "utf8"));
  const parties = JSON.parse(readFileSync("./data/tbs/parties.json", "utf8"));
  const bytes = await buildLrPdf(bookings[0], parties);
  writeFileSync("tmp-lr-real.pdf", Buffer.from(bytes));
  console.log("wrote tmp-lr-real.pdf");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

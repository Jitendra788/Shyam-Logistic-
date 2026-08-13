import { bad, failSave, ok, requireAuth } from "@/lib/tbs/api";
import { getMasters, saveMasters } from "@/lib/tbs/store";

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    return ok({ masters: await getMasters() });
  } catch (e) {
    return failSave(e);
  }
}

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const body = (await req.json()) as {
      particulars?: string;
      broker?: string;
    };
    const particulars = String(body.particulars || "").trim();
    const broker = String(body.broker || "").trim();
    if (!particulars && !broker) {
      return bad("Type Particulars or Broker/Owner Name first");
    }

    const masters = await getMasters();
    let changed = false;

    if (particulars) {
      const exists = masters.particulars.some(
        (x) => x.toLowerCase() === particulars.toLowerCase(),
      );
      if (!exists) {
        masters.particulars = [particulars, ...masters.particulars];
        changed = true;
      }
    }

    if (broker) {
      const exists = masters.brokers.some(
        (x) => x.toLowerCase() === broker.toLowerCase(),
      );
      if (!exists) {
        const rest = masters.brokers.filter((x) => x !== "All");
        masters.brokers = ["All", broker, ...rest];
        changed = true;
      }
    }

    if (changed) await saveMasters(masters);
    return ok({ masters });
  } catch (e) {
    return failSave(e);
  }
}

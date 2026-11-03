import { buildBlackFridayCsv, exportBlackFridayLeads } from "@/lib/black-friday-db";
import { authorizeBlackFridayStaff, blackFridayRouteError, getLeadFilters } from "@/lib/black-friday-route";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await authorizeBlackFridayStaff(true);
  if (auth.response) return auth.response;
  try {
    const rows = await exportBlackFridayLeads(getLeadFilters(new URL(request.url)));
    return new Response(`\uFEFF${buildBlackFridayCsv(rows)}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="black-friday-dial-fit.csv"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return blackFridayRouteError(error);
  }
}

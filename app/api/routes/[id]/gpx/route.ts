import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { id } = await params;
  const routeId = Number(id);
  if (!Number.isFinite(routeId)) {
    return new Response("Invalid route id", { status: 400 });
  }

  try {
    const provider = getStravaProvider({ accessToken: session.accessToken });
    const gpx = await provider.exportRouteGpx(routeId);
    return new Response(gpx, {
      headers: {
        "Content-Type": "application/gpx+xml",
        "Content-Disposition": `attachment; filename="route-${routeId}.gpx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("export gpx failed", err);
    return new Response("Failed to export route", { status: 502 });
  }
}

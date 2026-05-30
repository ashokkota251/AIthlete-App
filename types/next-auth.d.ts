import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    stravaAthleteId?: string;
    athleteUsername?: string;
    accessToken?: string;
    error?: string;
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    stravaAthleteId?: string;
    athleteUsername?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
  }
}

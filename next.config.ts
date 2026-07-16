import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the native libSQL driver out of the bundle; run it as a Node external.
  serverExternalPackages: ["@libsql/client", "libsql", "exceljs"],
};

export default nextConfig;

import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // 상위 디렉터리의 lockfile 등으로 워크스페이스 루트가 잘못 추론되는 것을 막는다.
  turbopack: {
    root: projectRoot
  }
};

export default nextConfig;

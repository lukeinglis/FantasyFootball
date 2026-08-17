import createMDX from "@next/mdx";
import withSerwistInit from "@serwist/next";

const withMDX = createMDX({});

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

export default withSerwist(withMDX(nextConfig));

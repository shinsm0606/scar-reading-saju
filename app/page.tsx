import type { Metadata } from "next";
import { SajuApp } from "./components/SajuApp";

export const metadata: Metadata = {
  title: "흉터까지 읽는 사주",
  description: "좋은 말만 듣고 싶다면, 시작하지 마세요. 반복되는 약점을 읽는 사주 경고 보고서.",
};

export default function Home() {
  return <SajuApp />;
}

import { SiteHeader } from "@/components/lp/site-header";
import { Hero } from "@/components/lp/hero";
import { Problem } from "@/components/lp/problem";
import { DigitalAdvantage } from "@/components/lp/digital-advantage";
import { OneMenuEverywhere } from "@/components/lp/one-menu-everywhere";
import { Values } from "@/components/lp/values";
import { Faq } from "@/components/lp/faq";
import { FinalCta } from "@/components/lp/final-cta";
import { SiteFooter } from "@/components/lp/site-footer";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Problem />
        <DigitalAdvantage />
        <OneMenuEverywhere />
        <Values />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
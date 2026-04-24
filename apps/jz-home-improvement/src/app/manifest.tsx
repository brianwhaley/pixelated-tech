import { Manifest, SiteInfo } from "@pixelated-tech/components/server";
import siteConfig from "@/app/data/siteconfig.json";

export default function manifest() {
	return Manifest({ siteInfo: siteConfig.siteInfo as SiteInfo });
}

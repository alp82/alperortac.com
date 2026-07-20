import { MOON_WINDOW, SUN_WINDOW } from "../components/minimap/helpers";
import { CELESTIAL_STORAGE_KEY, DEFAULT_CELESTIAL } from "./celestial";
import { PROJECTS } from "./projects";
import { DEFAULT_SKY_CURVE, SKY_DUSK, SKY_NIGHT, SKY_NOON } from "./skyCurve";
import { PANEL_KEY_TO_TOPIC_ID } from "./topics";

// Pathname -> the band topic section a cold subpage load parks at, so the boot
// script and the pre-paint seed in _layout can colour the sky for the subpage's
// time-of-day before the panel opens over it. Derived from the real registry so
// it can never drift: project panels live at `/projects/<slug>`, every other
// panel at `/<slug>`.
export const PATHNAME_TO_TOPIC_ID: Record<string, string> = Object.fromEntries(
	Object.entries(PANEL_KEY_TO_TOPIC_ID)
		.filter(([, topicId]) => Boolean(topicId))
		.map(([key, topicId]) => [
			PROJECTS.some((p) => p.slug === key) ? `/projects/${key}` : `/${key}`,
			topicId as string,
		]),
);

// What a cold entry should land on, decided from the URL alone (no DOM): an
// `/#anchor` lands on that element; a subpage colours the sky at its parked
// topic; anything else seeds from the current scroll. Shared by the boot script
// (implicitly) and _layout's pre-paint seed, and unit-tested in skyBoot.test.ts.
export type ColdEntry =
	| { mode: "anchor"; id: string }
	| { mode: "subpage"; topicId: string }
	| { mode: "plain" };

export function coldEntryFor(pathname: string, hash: string): ColdEntry {
	const id = hash.startsWith("#") ? hash.slice(1) : hash;
	if (id) return { mode: "anchor", id };
	const topicId = PATHNAME_TO_TOPIC_ID[pathname];
	if (topicId) return { mode: "subpage", topicId };
	return { mode: "plain" };
}

// The vanilla `skyAt(p)` the boot script ships - a faithful port of skyCurve's
// skyAt for the default curve, pinned against the real one in skyBoot.test.ts.
// Exported so the test evaluates the SAME source that ships. Constants are
// interpolated from skyCurve so the numbers can't drift; only the algorithm is
// hand-ported (a blocking inline script can't run TS or import modules).
export function skyBootSkyAtJs(): string {
	const c = DEFAULT_SKY_CURVE;
	return `
var NOON=[${SKY_NOON.r},${SKY_NOON.g},${SKY_NOON.b}],DUSK=[${SKY_DUSK.r},${SKY_DUSK.g},${SKY_DUSK.b}],NIGHT=[${SKY_NIGHT.r},${SKY_NIGHT.g},${SKY_NIGHT.b}];
var s1=${c.phase1[0]},e1=${c.phase1[1]},s2=${c.phase2[0]},e2=${c.phase2[1]},boost=${c.boost};
function cl(x){return Math.max(0,Math.min(1,x));}
function lerp(a,b,t){return [Math.round(a[0]+(b[0]-a[0])*t),Math.round(a[1]+(b[1]-a[1])*t),Math.round(a[2]+(b[2]-a[2])*t)];}
function bell(t){return Math.sin(t*Math.PI);}
function toHsl(c){var r=c[0]/255,g=c[1]/255,b=c[2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),h=0,s=0,l=(mx+mn)/2;if(mx!==mn){var d=mx-mn;s=l>0.5?d/(2-mx-mn):d/(mx+mn);if(mx===r)h=(g-b)/d+(g<b?6:0);else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h/=6;}return [h,s,l];}
function h2(p,q,t){if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;}
function toRgb(hsl){var h=hsl[0],s=hsl[1],l=hsl[2];if(s===0){var v=Math.round(l*255);return [v,v,v];}var q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q;return [Math.round(h2(p,q,h+1/3)*255),Math.round(h2(p,q,h)*255),Math.round(h2(p,q,h-1/3)*255)];}
function bs(c,w){var hsl=toHsl(c);hsl[1]=cl(hsl[1]*(1+boost*w));return toRgb(hsl);}
function css(c){return "rgb("+c[0]+", "+c[1]+", "+c[2]+")";}
function skyAt(p){if(p<=s1)return css(NOON);if(p<e1){var t=(p-s1)/(e1-s1);return css(bs(lerp(NOON,DUSK,t),bell(t)));}if(p<=s2)return css(DUSK);if(p<e2){var t=(p-s2)/(e2-s2);return css(bs(lerp(DUSK,NIGHT,t),bell(t)));}return css(NIGHT);}`;
}

// The vanilla celestial-scene port the boot script ships: given progress `p`
// and the minimap viewport band (vt/vh in %), returns the CSS-var map that
// positions the sky's sun/moon/stars and the minimap sun/moon dots for the
// default celestial params. A faithful port of celestialPosition /
// windowedProgress / sun|moonOpacityAt / the Stars opacities, pinned against
// the real ones in skyBoot.test.ts. Without this the sun would render at its
// day/top position over a night deep-link until hydration (~1s).
export function skyBootSceneJs(): string {
	const su = DEFAULT_CELESTIAL.sun;
	const mo = DEFAULT_CELESTIAL.moon;
	const [s2, e2] = DEFAULT_CELESTIAL.curve.phase2;
	return `
function scene(p,vt,vh){
var wp=function(x,st,en){var r=en-st;return r<=0?0:Math.min(Math.max((x-st)/r,0),1);};
var pos=function(lp,a){var x=a[0]+(a[2]-a[0])*lp;var yl=a[1]+(a[3]-a[1])*lp;return [x,yl-Math.sin(lp*Math.PI)*a[4]];};
var SUN=[${su.startX},${su.startY},${su.endX},${su.endY},${su.arcLift}];
var MOON=[${mo.startX},${mo.startY},${mo.endX},${mo.endY},${mo.arcLift}];
var sp=pos(wp(p,${SUN_WINDOW.start},${SUN_WINDOW.end}),SUN);
var mp=pos(wp(p,${MOON_WINDOW.start},${MOON_WINDOW.end}),MOON);
var so=p<0.45?1:Math.max(0,1-(p-0.45)/0.2);
var mn=p<0.5?0:Math.min(1,(p-0.5)/0.2);
var s2=${s2},e2=${e2};
var sto=Math.min(1,Math.max(0,(p-s2)/Math.max(e2-s2,0.001)));
var sho=Math.min(1,Math.max(0,(p-e2)/Math.max(1-e2,0.001)));
return {"--sun-x":sp[0]+"%","--sun-y":sp[1]+"%","--sun-o":so,"--moon-x":mp[0]+"%","--moon-y":mp[1]+"%","--moon-o":mn,"--stars-o":sto,"--shoot-o":sho,"--mm-sun-y":(vt+(sp[1]/100)*vh)+"%","--mm-moon-y":(vt+(mp[1]/100)*vh)+"%"};}`;
}

// A blocking, self-contained boot script injected before hydration. Before the
// browser paints a cold deep-link, it:
//   - lands the scroll: for an `/#anchor` it scrollIntoView()s the element
//     (respecting scroll-margin, instant since scroll-behavior is auto) so the
//     window is at the target on the FIRST frame - this is the single owner of
//     cold-entry scroll (TanStack scrollRestoration is off; see router.tsx). A
//     subpage doesn't scroll (its panel opens over the parked topic).
//   - colours the sky: `--sky-now` + body background for the landed position.
//   - positions the minimap: `--mm-top/-h/-dim/-band` so the current-section
//     indicator is right from frame one instead of snapping in at hydration.
// React re-owns all of these at hydration. Wrapped in try/catch so it can never
// blank the page.
export function skyBootScript(): string {
	const map = JSON.stringify(PATHNAME_TO_TOPIC_ID);
	return `(function(){try{${skyBootSkyAtJs()}${skyBootSceneJs()}
var doc=document.documentElement,s=doc.style;
var gv=${DEFAULT_CELESTIAL.gapVh};try{var _c=JSON.parse(localStorage.getItem(${JSON.stringify(CELESTIAL_STORAGE_KEY)}));if(_c&&typeof _c.gapVh==="number")gv=_c.gapVh;}catch(e){}
s.setProperty("--gap-vh",gv+"vh");
var MAP=${map};
var isAnchor=!!location.hash;
var id=isAnchor?location.hash.slice(1):MAP[location.pathname];
var el=id?document.getElementById(id):null;
var hasPanel=!!document.querySelector(".panel-surface[open]");
if(hasPanel){document.body.classList.add("panel-open");}
if(el||hasPanel||(!isAnchor&&location.pathname&&location.pathname!=="/")){doc.classList.add("panel-boot");}
var y=window.scrollY;
if(el){if(isAnchor){el.scrollIntoView();y=window.scrollY;}else{y=el.offsetTop;}}
var total=doc.scrollHeight-window.innerHeight;
var p=total>0?cl(y/total):0;
var color=skyAt(p);
s.setProperty("--sky-now",color);
document.body.style.backgroundColor=color;
var vr=window.innerHeight/doc.scrollHeight;
var vt=p*(1-vr)*100,vh=Math.max(vr*100,4),vb=vt+vh;
s.setProperty("--mm-top",vt+"%");
s.setProperty("--mm-h",vh+"%");
s.setProperty("--mm-dim","linear-gradient(to bottom,black 0%,black "+vt+"%,transparent "+vt+"%,transparent "+vb+"%,black "+vb+"%,black 100%)");
s.setProperty("--mm-band","linear-gradient(to bottom,transparent 0%,transparent "+vt+"%,black "+vt+"%,black "+vb+"%,transparent "+vb+"%,transparent 100%)");
var SC=scene(p,vt,vh);for(var k in SC){s.setProperty(k,SC[k]);}
}catch(e){}})();`;
}

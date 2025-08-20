import { __commonJS, __esm, __require, __toESM } from "./chunk-Dsqw6BSZ.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nativeFsp from "node:fs/promises";
import fs from "node:fs";
import process$1 from "node:process";

//#region ../../../node_modules/.pnpm/find-up-simple@1.0.1/node_modules/find-up-simple/index.js
async function findUp(name, { cwd = process$1.cwd(), type = "file", stopAt } = {}) {
	let directory = path.resolve(toPath$1(cwd) ?? "");
	const { root } = path.parse(directory);
	stopAt = path.resolve(directory, toPath$1(stopAt ?? root));
	const isAbsoluteName = path.isAbsolute(name);
	while (directory) {
		const filePath = isAbsoluteName ? name : path.join(directory, name);
		try {
			const stats = await nativeFsp.stat(filePath);
			if (type === "file" && stats.isFile() || type === "directory" && stats.isDirectory()) return filePath;
		} catch {}
		if (directory === stopAt || directory === root) break;
		directory = path.dirname(directory);
	}
}
var toPath$1;
var init_find_up_simple = __esm({ "../../../node_modules/.pnpm/find-up-simple@1.0.1/node_modules/find-up-simple/index.js": (() => {
	toPath$1 = (urlOrPath) => urlOrPath instanceof URL ? fileURLToPath(urlOrPath) : urlOrPath;
}) });

//#endregion
//#region ../../../node_modules/.pnpm/picocolors@1.1.1/node_modules/picocolors/picocolors.js
var require_picocolors = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/picocolors@1.1.1/node_modules/picocolors/picocolors.js": ((exports, module) => {
	let p = process || {}, argv = p.argv || [], env = p.env || {};
	let isColorSupported$1 = !(!!env.NO_COLOR || argv.includes("--no-color")) && (!!env.FORCE_COLOR || argv.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env.TERM !== "dumb" || !!env.CI);
	let formatter = (open, close, replace = open) => (input) => {
		let string = "" + input, index$1 = string.indexOf(close, open.length);
		return ~index$1 ? open + replaceClose(string, close, replace, index$1) + close : open + string + close;
	};
	let replaceClose = (string, close, replace, index$1) => {
		let result = "", cursor = 0;
		do {
			result += string.substring(cursor, index$1) + replace;
			cursor = index$1 + close.length;
			index$1 = string.indexOf(close, cursor);
		} while (~index$1);
		return result + string.substring(cursor);
	};
	let createColors = (enabled = isColorSupported$1) => {
		let f = enabled ? formatter : () => String;
		return {
			isColorSupported: enabled,
			reset: f("\x1B[0m", "\x1B[0m"),
			bold: f("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
			dim: f("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
			italic: f("\x1B[3m", "\x1B[23m"),
			underline: f("\x1B[4m", "\x1B[24m"),
			inverse: f("\x1B[7m", "\x1B[27m"),
			hidden: f("\x1B[8m", "\x1B[28m"),
			strikethrough: f("\x1B[9m", "\x1B[29m"),
			black: f("\x1B[30m", "\x1B[39m"),
			red: f("\x1B[31m", "\x1B[39m"),
			green: f("\x1B[32m", "\x1B[39m"),
			yellow: f("\x1B[33m", "\x1B[39m"),
			blue: f("\x1B[34m", "\x1B[39m"),
			magenta: f("\x1B[35m", "\x1B[39m"),
			cyan: f("\x1B[36m", "\x1B[39m"),
			white: f("\x1B[37m", "\x1B[39m"),
			gray: f("\x1B[90m", "\x1B[39m"),
			bgBlack: f("\x1B[40m", "\x1B[49m"),
			bgRed: f("\x1B[41m", "\x1B[49m"),
			bgGreen: f("\x1B[42m", "\x1B[49m"),
			bgYellow: f("\x1B[43m", "\x1B[49m"),
			bgBlue: f("\x1B[44m", "\x1B[49m"),
			bgMagenta: f("\x1B[45m", "\x1B[49m"),
			bgCyan: f("\x1B[46m", "\x1B[49m"),
			bgWhite: f("\x1B[47m", "\x1B[49m"),
			blackBright: f("\x1B[90m", "\x1B[39m"),
			redBright: f("\x1B[91m", "\x1B[39m"),
			greenBright: f("\x1B[92m", "\x1B[39m"),
			yellowBright: f("\x1B[93m", "\x1B[39m"),
			blueBright: f("\x1B[94m", "\x1B[39m"),
			magentaBright: f("\x1B[95m", "\x1B[39m"),
			cyanBright: f("\x1B[96m", "\x1B[39m"),
			whiteBright: f("\x1B[97m", "\x1B[39m"),
			bgBlackBright: f("\x1B[100m", "\x1B[49m"),
			bgRedBright: f("\x1B[101m", "\x1B[49m"),
			bgGreenBright: f("\x1B[102m", "\x1B[49m"),
			bgYellowBright: f("\x1B[103m", "\x1B[49m"),
			bgBlueBright: f("\x1B[104m", "\x1B[49m"),
			bgMagentaBright: f("\x1B[105m", "\x1B[49m"),
			bgCyanBright: f("\x1B[106m", "\x1B[49m"),
			bgWhiteBright: f("\x1B[107m", "\x1B[49m")
		};
	};
	module.exports = createColors();
	module.exports.createColors = createColors;
}) });

//#endregion
//#region ../../../node_modules/.pnpm/js-tokens@4.0.0/node_modules/js-tokens/index.js
var require_js_tokens = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/js-tokens@4.0.0/node_modules/js-tokens/index.js": ((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = /((['"])(?:(?!\2|\\).|\\(?:\r\n|[\s\S]))*(\2)?|`(?:[^`\\$]|\\[\s\S]|\$(?!\{)|\$\{(?:[^{}]|\{[^}]*\}?)*\}?)*(`)?)|(\/\/.*)|(\/\*(?:[^*]|\*(?!\/))*(\*\/)?)|(\/(?!\*)(?:\[(?:(?![\]\\]).|\\.)*\]|(?![\/\]\\]).|\\.)+\/(?:(?!\s*(?:\b|[\u0080-\uFFFF$\\'"~({]|[+\-!](?!=)|\.?\d))|[gmiyus]{1,6}\b(?![\u0080-\uFFFF$\\]|\s*(?:[+\-*%&|^<>!=?({]|\/(?![\/*])))))|(0[xX][\da-fA-F]+|0[oO][0-7]+|0[bB][01]+|(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?)|((?!\d)(?:(?!\s)[$\w\u0080-\uFFFF]|\\u[\da-fA-F]{4}|\\u\{[\da-fA-F]+\})+)|(--|\+\+|&&|\|\||=>|\.{3}|(?:[+\-\/%&|^]|\*{1,2}|<{1,2}|>{1,3}|!=?|={1,2})=?|[?~.,:;[\](){}])|(\s+)|(^$|[\s\S])/g;
	exports.matchToToken = function(match) {
		var token = {
			type: "invalid",
			value: match[0],
			closed: void 0
		};
		if (match[1]) token.type = "string", token.closed = !!(match[3] || match[4]);
		else if (match[5]) token.type = "comment";
		else if (match[6]) token.type = "comment", token.closed = !!match[7];
		else if (match[8]) token.type = "regex";
		else if (match[9]) token.type = "number";
		else if (match[10]) token.type = "name";
		else if (match[11]) token.type = "punctuator";
		else if (match[12]) token.type = "whitespace";
		return token;
	};
}) });

//#endregion
//#region ../../../node_modules/.pnpm/@babel+helper-validator-identifier@7.27.1/node_modules/@babel/helper-validator-identifier/lib/identifier.js
var require_identifier = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/@babel+helper-validator-identifier@7.27.1/node_modules/@babel/helper-validator-identifier/lib/identifier.js": ((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.isIdentifierChar = isIdentifierChar;
	exports.isIdentifierName = isIdentifierName;
	exports.isIdentifierStart = isIdentifierStart;
	let nonASCIIidentifierStartChars = "ªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮͰ-ʹͶͷͺ-ͽͿΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԯԱ-Ֆՙՠ-ֈא-תׯ-ײؠ-يٮٯٱ-ۓەۥۦۮۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪߴߵߺࠀ-ࠕࠚࠤࠨࡀ-ࡘࡠ-ࡪࡰ-ࢇࢉ-ࢎࢠ-ࣉऄ-हऽॐक़-ॡॱ-ঀঅ-ঌএঐও-নপ-রলশ-হঽৎড়ঢ়য়-ৡৰৱৼਅ-ਊਏਐਓ-ਨਪ-ਰਲਲ਼ਵਸ਼ਸਹਖ਼-ੜਫ਼ੲ-ੴઅ-ઍએ-ઑઓ-નપ-રલળવ-હઽૐૠૡૹଅ-ଌଏଐଓ-ନପ-ରଲଳଵ-ହଽଡ଼ଢ଼ୟ-ୡୱஃஅ-ஊஎ-ஐஒ-கஙசஜஞடணதந-பம-ஹௐఅ-ఌఎ-ఐఒ-నప-హఽౘ-ౚౝౠౡಀಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹಽೝೞೠೡೱೲഄ-ഌഎ-ഐഒ-ഺഽൎൔ-ൖൟ-ൡൺ-ൿඅ-ඖක-නඳ-රලව-ෆก-ะาำเ-ๆກຂຄຆ-ຊຌ-ຣລວ-ະາຳຽເ-ໄໆໜ-ໟༀཀ-ཇཉ-ཬྈ-ྌက-ဪဿၐ-ၕၚ-ၝၡၥၦၮ-ၰၵ-ႁႎႠ-ჅჇჍა-ჺჼ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏽᏸ-ᏽᐁ-ᙬᙯ-ᙿᚁ-ᚚᚠ-ᛪᛮ-ᛸᜀ-ᜑᜟ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៗៜᠠ-ᡸᢀ-ᢨᢪᢰ-ᣵᤀ-ᤞᥐ-ᥭᥰ-ᥴᦀ-ᦫᦰ-ᧉᨀ-ᨖᨠ-ᩔᪧᬅ-ᬳᭅ-ᭌᮃ-ᮠᮮᮯᮺ-ᯥᰀ-ᰣᱍ-ᱏᱚ-ᱽᲀ-ᲊᲐ-ᲺᲽ-Ჿᳩ-ᳬᳮ-ᳳᳵᳶᳺᴀ-ᶿḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿₐ-ₜℂℇℊ-ℓℕ℘-ℝℤΩℨK-ℹℼ-ℿⅅ-ⅉⅎⅠ-ↈⰀ-ⳤⳫ-ⳮⳲⳳⴀ-ⴥⴧⴭⴰ-ⵧⵯⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞ々-〇〡-〩〱-〵〸-〼ぁ-ゖ゛-ゟァ-ヺー-ヿㄅ-ㄯㄱ-ㆎㆠ-ㆿㇰ-ㇿ㐀-䶿一-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘟꘪꘫꙀ-ꙮꙿ-ꚝꚠ-ꛯꜗ-ꜟꜢ-ꞈꞋ-ꟍꟐꟑꟓꟕ-Ƛꟲ-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꣲ-ꣷꣻꣽꣾꤊ-ꤥꤰ-ꥆꥠ-ꥼꦄ-ꦲꧏꧠ-ꧤꧦ-ꧯꧺ-ꧾꨀ-ꨨꩀ-ꩂꩄ-ꩋꩠ-ꩶꩺꩾ-ꪯꪱꪵꪶꪹ-ꪽꫀꫂꫛ-ꫝꫠ-ꫪꫲ-ꫴꬁ-ꬆꬉ-ꬎꬑ-ꬖꬠ-ꬦꬨ-ꬮꬰ-ꭚꭜ-ꭩꭰ-ꯢ가-힣ힰ-ퟆퟋ-ퟻ豈-舘並-龎ﬀ-ﬆﬓ-ﬗיִײַ-ﬨשׁ-זּטּ-לּמּנּסּףּפּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻﹰ-ﹴﹶ-ﻼＡ-Ｚａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ";
	let nonASCIIidentifierChars = "·̀-ͯ·҃-֑҇-ׇֽֿׁׂׅׄؐ-ًؚ-٩ٰۖ-ۜ۟-۪ۤۧۨ-ۭ۰-۹ܑܰ-݊ަ-ް߀-߉߫-߽߳ࠖ-࠙ࠛ-ࠣࠥ-ࠧࠩ-࡙࠭-࡛ࢗ-࢟࣊-ࣣ࣡-ःऺ-़ा-ॏ॑-ॗॢॣ०-९ঁ-ঃ়া-ৄেৈো-্ৗৢৣ০-৯৾ਁ-ਃ਼ਾ-ੂੇੈੋ-੍ੑ੦-ੱੵઁ-ઃ઼ા-ૅે-ૉો-્ૢૣ૦-૯ૺ-૿ଁ-ଃ଼ା-ୄେୈୋ-୍୕-ୗୢୣ୦-୯ஂா-ூெ-ைொ-்ௗ௦-௯ఀ-ఄ఼ా-ౄె-ైొ-్ౕౖౢౣ౦-౯ಁ-ಃ಼ಾ-ೄೆ-ೈೊ-್ೕೖೢೣ೦-೯ೳഀ-ഃ഻഼ാ-ൄെ-ൈൊ-്ൗൢൣ൦-൯ඁ-ඃ්ා-ුූෘ-ෟ෦-෯ෲෳัิ-ฺ็-๎๐-๙ັິ-ຼ່-໎໐-໙༘༙༠-༩༹༵༷༾༿ཱ-྄྆྇ྍ-ྗྙ-ྼ࿆ါ-ှ၀-၉ၖ-ၙၞ-ၠၢ-ၤၧ-ၭၱ-ၴႂ-ႍႏ-ႝ፝-፟፩-፱ᜒ-᜕ᜲ-᜴ᝒᝓᝲᝳ឴-៓៝០-៩᠋-᠍᠏-᠙ᢩᤠ-ᤫᤰ-᤻᥆-᥏᧐-᧚ᨗ-ᨛᩕ-ᩞ᩠-᩿᩼-᪉᪐-᪙᪰-᪽ᪿ-ᫎᬀ-ᬄ᬴-᭄᭐-᭙᭫-᭳ᮀ-ᮂᮡ-ᮭ᮰-᮹᯦-᯳ᰤ-᰷᱀-᱉᱐-᱙᳐-᳔᳒-᳨᳭᳴᳷-᳹᷀-᷿‌‍‿⁀⁔⃐-⃥⃜⃡-⃰⳯-⵿⳱ⷠ-〪ⷿ-゙゚〯・꘠-꘩꙯ꙴ-꙽ꚞꚟ꛰꛱ꠂ꠆ꠋꠣ-ꠧ꠬ꢀꢁꢴ-ꣅ꣐-꣙꣠-꣱ꣿ-꤉ꤦ-꤭ꥇ-꥓ꦀ-ꦃ꦳-꧀꧐-꧙ꧥ꧰-꧹ꨩ-ꨶꩃꩌꩍ꩐-꩙ꩻ-ꩽꪰꪲ-ꪴꪷꪸꪾ꪿꫁ꫫ-ꫯꫵ꫶ꯣ-ꯪ꯬꯭꯰-꯹ﬞ︀-️︠-︯︳︴﹍-﹏０-９＿･";
	const nonASCIIidentifierStart = /* @__PURE__ */ new RegExp("[" + nonASCIIidentifierStartChars + "]");
	const nonASCIIidentifier = /* @__PURE__ */ new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");
	nonASCIIidentifierStartChars = nonASCIIidentifierChars = null;
	const astralIdentifierStartCodes = [
		0,
		11,
		2,
		25,
		2,
		18,
		2,
		1,
		2,
		14,
		3,
		13,
		35,
		122,
		70,
		52,
		268,
		28,
		4,
		48,
		48,
		31,
		14,
		29,
		6,
		37,
		11,
		29,
		3,
		35,
		5,
		7,
		2,
		4,
		43,
		157,
		19,
		35,
		5,
		35,
		5,
		39,
		9,
		51,
		13,
		10,
		2,
		14,
		2,
		6,
		2,
		1,
		2,
		10,
		2,
		14,
		2,
		6,
		2,
		1,
		4,
		51,
		13,
		310,
		10,
		21,
		11,
		7,
		25,
		5,
		2,
		41,
		2,
		8,
		70,
		5,
		3,
		0,
		2,
		43,
		2,
		1,
		4,
		0,
		3,
		22,
		11,
		22,
		10,
		30,
		66,
		18,
		2,
		1,
		11,
		21,
		11,
		25,
		71,
		55,
		7,
		1,
		65,
		0,
		16,
		3,
		2,
		2,
		2,
		28,
		43,
		28,
		4,
		28,
		36,
		7,
		2,
		27,
		28,
		53,
		11,
		21,
		11,
		18,
		14,
		17,
		111,
		72,
		56,
		50,
		14,
		50,
		14,
		35,
		39,
		27,
		10,
		22,
		251,
		41,
		7,
		1,
		17,
		2,
		60,
		28,
		11,
		0,
		9,
		21,
		43,
		17,
		47,
		20,
		28,
		22,
		13,
		52,
		58,
		1,
		3,
		0,
		14,
		44,
		33,
		24,
		27,
		35,
		30,
		0,
		3,
		0,
		9,
		34,
		4,
		0,
		13,
		47,
		15,
		3,
		22,
		0,
		2,
		0,
		36,
		17,
		2,
		24,
		20,
		1,
		64,
		6,
		2,
		0,
		2,
		3,
		2,
		14,
		2,
		9,
		8,
		46,
		39,
		7,
		3,
		1,
		3,
		21,
		2,
		6,
		2,
		1,
		2,
		4,
		4,
		0,
		19,
		0,
		13,
		4,
		31,
		9,
		2,
		0,
		3,
		0,
		2,
		37,
		2,
		0,
		26,
		0,
		2,
		0,
		45,
		52,
		19,
		3,
		21,
		2,
		31,
		47,
		21,
		1,
		2,
		0,
		185,
		46,
		42,
		3,
		37,
		47,
		21,
		0,
		60,
		42,
		14,
		0,
		72,
		26,
		38,
		6,
		186,
		43,
		117,
		63,
		32,
		7,
		3,
		0,
		3,
		7,
		2,
		1,
		2,
		23,
		16,
		0,
		2,
		0,
		95,
		7,
		3,
		38,
		17,
		0,
		2,
		0,
		29,
		0,
		11,
		39,
		8,
		0,
		22,
		0,
		12,
		45,
		20,
		0,
		19,
		72,
		200,
		32,
		32,
		8,
		2,
		36,
		18,
		0,
		50,
		29,
		113,
		6,
		2,
		1,
		2,
		37,
		22,
		0,
		26,
		5,
		2,
		1,
		2,
		31,
		15,
		0,
		328,
		18,
		16,
		0,
		2,
		12,
		2,
		33,
		125,
		0,
		80,
		921,
		103,
		110,
		18,
		195,
		2637,
		96,
		16,
		1071,
		18,
		5,
		26,
		3994,
		6,
		582,
		6842,
		29,
		1763,
		568,
		8,
		30,
		18,
		78,
		18,
		29,
		19,
		47,
		17,
		3,
		32,
		20,
		6,
		18,
		433,
		44,
		212,
		63,
		129,
		74,
		6,
		0,
		67,
		12,
		65,
		1,
		2,
		0,
		29,
		6135,
		9,
		1237,
		42,
		9,
		8936,
		3,
		2,
		6,
		2,
		1,
		2,
		290,
		16,
		0,
		30,
		2,
		3,
		0,
		15,
		3,
		9,
		395,
		2309,
		106,
		6,
		12,
		4,
		8,
		8,
		9,
		5991,
		84,
		2,
		70,
		2,
		1,
		3,
		0,
		3,
		1,
		3,
		3,
		2,
		11,
		2,
		0,
		2,
		6,
		2,
		64,
		2,
		3,
		3,
		7,
		2,
		6,
		2,
		27,
		2,
		3,
		2,
		4,
		2,
		0,
		4,
		6,
		2,
		339,
		3,
		24,
		2,
		24,
		2,
		30,
		2,
		24,
		2,
		30,
		2,
		24,
		2,
		30,
		2,
		24,
		2,
		30,
		2,
		24,
		2,
		7,
		1845,
		30,
		7,
		5,
		262,
		61,
		147,
		44,
		11,
		6,
		17,
		0,
		322,
		29,
		19,
		43,
		485,
		27,
		229,
		29,
		3,
		0,
		496,
		6,
		2,
		3,
		2,
		1,
		2,
		14,
		2,
		196,
		60,
		67,
		8,
		0,
		1205,
		3,
		2,
		26,
		2,
		1,
		2,
		0,
		3,
		0,
		2,
		9,
		2,
		3,
		2,
		0,
		2,
		0,
		7,
		0,
		5,
		0,
		2,
		0,
		2,
		0,
		2,
		2,
		2,
		1,
		2,
		0,
		3,
		0,
		2,
		0,
		2,
		0,
		2,
		0,
		2,
		0,
		2,
		1,
		2,
		0,
		3,
		3,
		2,
		6,
		2,
		3,
		2,
		3,
		2,
		0,
		2,
		9,
		2,
		16,
		6,
		2,
		2,
		4,
		2,
		16,
		4421,
		42719,
		33,
		4153,
		7,
		221,
		3,
		5761,
		15,
		7472,
		16,
		621,
		2467,
		541,
		1507,
		4938,
		6,
		4191
	];
	const astralIdentifierCodes = [
		509,
		0,
		227,
		0,
		150,
		4,
		294,
		9,
		1368,
		2,
		2,
		1,
		6,
		3,
		41,
		2,
		5,
		0,
		166,
		1,
		574,
		3,
		9,
		9,
		7,
		9,
		32,
		4,
		318,
		1,
		80,
		3,
		71,
		10,
		50,
		3,
		123,
		2,
		54,
		14,
		32,
		10,
		3,
		1,
		11,
		3,
		46,
		10,
		8,
		0,
		46,
		9,
		7,
		2,
		37,
		13,
		2,
		9,
		6,
		1,
		45,
		0,
		13,
		2,
		49,
		13,
		9,
		3,
		2,
		11,
		83,
		11,
		7,
		0,
		3,
		0,
		158,
		11,
		6,
		9,
		7,
		3,
		56,
		1,
		2,
		6,
		3,
		1,
		3,
		2,
		10,
		0,
		11,
		1,
		3,
		6,
		4,
		4,
		68,
		8,
		2,
		0,
		3,
		0,
		2,
		3,
		2,
		4,
		2,
		0,
		15,
		1,
		83,
		17,
		10,
		9,
		5,
		0,
		82,
		19,
		13,
		9,
		214,
		6,
		3,
		8,
		28,
		1,
		83,
		16,
		16,
		9,
		82,
		12,
		9,
		9,
		7,
		19,
		58,
		14,
		5,
		9,
		243,
		14,
		166,
		9,
		71,
		5,
		2,
		1,
		3,
		3,
		2,
		0,
		2,
		1,
		13,
		9,
		120,
		6,
		3,
		6,
		4,
		0,
		29,
		9,
		41,
		6,
		2,
		3,
		9,
		0,
		10,
		10,
		47,
		15,
		343,
		9,
		54,
		7,
		2,
		7,
		17,
		9,
		57,
		21,
		2,
		13,
		123,
		5,
		4,
		0,
		2,
		1,
		2,
		6,
		2,
		0,
		9,
		9,
		49,
		4,
		2,
		1,
		2,
		4,
		9,
		9,
		330,
		3,
		10,
		1,
		2,
		0,
		49,
		6,
		4,
		4,
		14,
		10,
		5350,
		0,
		7,
		14,
		11465,
		27,
		2343,
		9,
		87,
		9,
		39,
		4,
		60,
		6,
		26,
		9,
		535,
		9,
		470,
		0,
		2,
		54,
		8,
		3,
		82,
		0,
		12,
		1,
		19628,
		1,
		4178,
		9,
		519,
		45,
		3,
		22,
		543,
		4,
		4,
		5,
		9,
		7,
		3,
		6,
		31,
		3,
		149,
		2,
		1418,
		49,
		513,
		54,
		5,
		49,
		9,
		0,
		15,
		0,
		23,
		4,
		2,
		14,
		1361,
		6,
		2,
		16,
		3,
		6,
		2,
		1,
		2,
		4,
		101,
		0,
		161,
		6,
		10,
		9,
		357,
		0,
		62,
		13,
		499,
		13,
		245,
		1,
		2,
		9,
		726,
		6,
		110,
		6,
		6,
		9,
		4759,
		9,
		787719,
		239
	];
	function isInAstralSet(code, set) {
		let pos = 65536;
		for (let i = 0, length = set.length; i < length; i += 2) {
			pos += set[i];
			if (pos > code) return false;
			pos += set[i + 1];
			if (pos >= code) return true;
		}
		return false;
	}
	function isIdentifierStart(code) {
		if (code < 65) return code === 36;
		if (code <= 90) return true;
		if (code < 97) return code === 95;
		if (code <= 122) return true;
		if (code <= 65535) return code >= 170 && nonASCIIidentifierStart.test(String.fromCharCode(code));
		return isInAstralSet(code, astralIdentifierStartCodes);
	}
	function isIdentifierChar(code) {
		if (code < 48) return code === 36;
		if (code < 58) return true;
		if (code < 65) return false;
		if (code <= 90) return true;
		if (code < 97) return code === 95;
		if (code <= 122) return true;
		if (code <= 65535) return code >= 170 && nonASCIIidentifier.test(String.fromCharCode(code));
		return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes);
	}
	function isIdentifierName(name) {
		let isFirst = true;
		for (let i = 0; i < name.length; i++) {
			let cp = name.charCodeAt(i);
			if ((cp & 64512) === 55296 && i + 1 < name.length) {
				const trail = name.charCodeAt(++i);
				if ((trail & 64512) === 56320) cp = 65536 + ((cp & 1023) << 10) + (trail & 1023);
			}
			if (isFirst) {
				isFirst = false;
				if (!isIdentifierStart(cp)) return false;
			} else if (!isIdentifierChar(cp)) return false;
		}
		return !isFirst;
	}
}) });

//#endregion
//#region ../../../node_modules/.pnpm/@babel+helper-validator-identifier@7.27.1/node_modules/@babel/helper-validator-identifier/lib/keyword.js
var require_keyword = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/@babel+helper-validator-identifier@7.27.1/node_modules/@babel/helper-validator-identifier/lib/keyword.js": ((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.isKeyword = isKeyword;
	exports.isReservedWord = isReservedWord;
	exports.isStrictBindOnlyReservedWord = isStrictBindOnlyReservedWord;
	exports.isStrictBindReservedWord = isStrictBindReservedWord;
	exports.isStrictReservedWord = isStrictReservedWord;
	const reservedWords = {
		keyword: [
			"break",
			"case",
			"catch",
			"continue",
			"debugger",
			"default",
			"do",
			"else",
			"finally",
			"for",
			"function",
			"if",
			"return",
			"switch",
			"throw",
			"try",
			"var",
			"const",
			"while",
			"with",
			"new",
			"this",
			"super",
			"class",
			"extends",
			"export",
			"import",
			"null",
			"true",
			"false",
			"in",
			"instanceof",
			"typeof",
			"void",
			"delete"
		],
		strict: [
			"implements",
			"interface",
			"let",
			"package",
			"private",
			"protected",
			"public",
			"static",
			"yield"
		],
		strictBind: ["eval", "arguments"]
	};
	const keywords = new Set(reservedWords.keyword);
	const reservedWordsStrictSet = new Set(reservedWords.strict);
	const reservedWordsStrictBindSet = new Set(reservedWords.strictBind);
	function isReservedWord(word, inModule) {
		return inModule && word === "await" || word === "enum";
	}
	function isStrictReservedWord(word, inModule) {
		return isReservedWord(word, inModule) || reservedWordsStrictSet.has(word);
	}
	function isStrictBindOnlyReservedWord(word) {
		return reservedWordsStrictBindSet.has(word);
	}
	function isStrictBindReservedWord(word, inModule) {
		return isStrictReservedWord(word, inModule) || isStrictBindOnlyReservedWord(word);
	}
	function isKeyword(word) {
		return keywords.has(word);
	}
}) });

//#endregion
//#region ../../../node_modules/.pnpm/@babel+helper-validator-identifier@7.27.1/node_modules/@babel/helper-validator-identifier/lib/index.js
var require_lib$2 = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/@babel+helper-validator-identifier@7.27.1/node_modules/@babel/helper-validator-identifier/lib/index.js": ((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	Object.defineProperty(exports, "isIdentifierChar", {
		enumerable: true,
		get: function() {
			return _identifier.isIdentifierChar;
		}
	});
	Object.defineProperty(exports, "isIdentifierName", {
		enumerable: true,
		get: function() {
			return _identifier.isIdentifierName;
		}
	});
	Object.defineProperty(exports, "isIdentifierStart", {
		enumerable: true,
		get: function() {
			return _identifier.isIdentifierStart;
		}
	});
	Object.defineProperty(exports, "isKeyword", {
		enumerable: true,
		get: function() {
			return _keyword.isKeyword;
		}
	});
	Object.defineProperty(exports, "isReservedWord", {
		enumerable: true,
		get: function() {
			return _keyword.isReservedWord;
		}
	});
	Object.defineProperty(exports, "isStrictBindOnlyReservedWord", {
		enumerable: true,
		get: function() {
			return _keyword.isStrictBindOnlyReservedWord;
		}
	});
	Object.defineProperty(exports, "isStrictBindReservedWord", {
		enumerable: true,
		get: function() {
			return _keyword.isStrictBindReservedWord;
		}
	});
	Object.defineProperty(exports, "isStrictReservedWord", {
		enumerable: true,
		get: function() {
			return _keyword.isStrictReservedWord;
		}
	});
	var _identifier = require_identifier();
	var _keyword = require_keyword();
}) });

//#endregion
//#region ../../../node_modules/.pnpm/@babel+code-frame@7.27.1/node_modules/@babel/code-frame/lib/index.js
var require_lib$1 = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/@babel+code-frame@7.27.1/node_modules/@babel/code-frame/lib/index.js": ((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	var picocolors = require_picocolors();
	var jsTokens = require_js_tokens();
	var helperValidatorIdentifier = require_lib$2();
	function isColorSupported() {
		return typeof process === "object" && (process.env.FORCE_COLOR === "0" || process.env.FORCE_COLOR === "false") ? false : picocolors.isColorSupported;
	}
	const compose = (f, g) => (v) => f(g(v));
	function buildDefs(colors) {
		return {
			keyword: colors.cyan,
			capitalized: colors.yellow,
			jsxIdentifier: colors.yellow,
			punctuator: colors.yellow,
			number: colors.magenta,
			string: colors.green,
			regex: colors.magenta,
			comment: colors.gray,
			invalid: compose(compose(colors.white, colors.bgRed), colors.bold),
			gutter: colors.gray,
			marker: compose(colors.red, colors.bold),
			message: compose(colors.red, colors.bold),
			reset: colors.reset
		};
	}
	const defsOn = buildDefs(picocolors.createColors(true));
	const defsOff = buildDefs(picocolors.createColors(false));
	function getDefs(enabled) {
		return enabled ? defsOn : defsOff;
	}
	const sometimesKeywords = new Set([
		"as",
		"async",
		"from",
		"get",
		"of",
		"set"
	]);
	const NEWLINE$1 = /\r\n|[\n\r\u2028\u2029]/;
	const BRACKET = /^[()[\]{}]$/;
	let tokenize;
	{
		const JSX_TAG = /^[a-z][\w-]*$/i;
		const getTokenType = function(token, offset, text) {
			if (token.type === "name") {
				if (helperValidatorIdentifier.isKeyword(token.value) || helperValidatorIdentifier.isStrictReservedWord(token.value, true) || sometimesKeywords.has(token.value)) return "keyword";
				if (JSX_TAG.test(token.value) && (text[offset - 1] === "<" || text.slice(offset - 2, offset) === "</")) return "jsxIdentifier";
				if (token.value[0] !== token.value[0].toLowerCase()) return "capitalized";
			}
			if (token.type === "punctuator" && BRACKET.test(token.value)) return "bracket";
			if (token.type === "invalid" && (token.value === "@" || token.value === "#")) return "punctuator";
			return token.type;
		};
		tokenize = function* (text) {
			let match;
			while (match = jsTokens.default.exec(text)) {
				const token = jsTokens.matchToToken(match);
				yield {
					type: getTokenType(token, match.index, text),
					value: token.value
				};
			}
		};
	}
	function highlight(text) {
		if (text === "") return "";
		const defs = getDefs(true);
		let highlighted = "";
		for (const { type, value } of tokenize(text)) if (type in defs) highlighted += value.split(NEWLINE$1).map((str) => defs[type](str)).join("\n");
		else highlighted += value;
		return highlighted;
	}
	let deprecationWarningShown = false;
	const NEWLINE = /\r\n|[\n\r\u2028\u2029]/;
	function getMarkerLines(loc, source, opts) {
		const startLoc = Object.assign({
			column: 0,
			line: -1
		}, loc.start);
		const endLoc = Object.assign({}, startLoc, loc.end);
		const { linesAbove = 2, linesBelow = 3 } = opts || {};
		const startLine = startLoc.line;
		const startColumn = startLoc.column;
		const endLine = endLoc.line;
		const endColumn = endLoc.column;
		let start = Math.max(startLine - (linesAbove + 1), 0);
		let end = Math.min(source.length, endLine + linesBelow);
		if (startLine === -1) start = 0;
		if (endLine === -1) end = source.length;
		const lineDiff = endLine - startLine;
		const markerLines = {};
		if (lineDiff) for (let i = 0; i <= lineDiff; i++) {
			const lineNumber = i + startLine;
			if (!startColumn) markerLines[lineNumber] = true;
			else if (i === 0) {
				const sourceLength = source[lineNumber - 1].length;
				markerLines[lineNumber] = [startColumn, sourceLength - startColumn + 1];
			} else if (i === lineDiff) markerLines[lineNumber] = [0, endColumn];
			else {
				const sourceLength = source[lineNumber - i].length;
				markerLines[lineNumber] = [0, sourceLength];
			}
		}
		else if (startColumn === endColumn) if (startColumn) markerLines[startLine] = [startColumn, 0];
		else markerLines[startLine] = true;
		else markerLines[startLine] = [startColumn, endColumn - startColumn];
		return {
			start,
			end,
			markerLines
		};
	}
	function codeFrameColumns$1(rawLines, loc, opts = {}) {
		const shouldHighlight = opts.forceColor || isColorSupported() && opts.highlightCode;
		const defs = getDefs(shouldHighlight);
		const lines = rawLines.split(NEWLINE);
		const { start, end, markerLines } = getMarkerLines(loc, lines, opts);
		const hasColumns = loc.start && typeof loc.start.column === "number";
		const numberMaxWidth = String(end).length;
		const highlightedLines = shouldHighlight ? highlight(rawLines) : rawLines;
		let frame = highlightedLines.split(NEWLINE, end).slice(start, end).map((line, index$1) => {
			const number = start + 1 + index$1;
			const paddedNumber = ` ${number}`.slice(-numberMaxWidth);
			const gutter = ` ${paddedNumber} |`;
			const hasMarker = markerLines[number];
			const lastMarkerLine = !markerLines[number + 1];
			if (hasMarker) {
				let markerLine = "";
				if (Array.isArray(hasMarker)) {
					const markerSpacing = line.slice(0, Math.max(hasMarker[0] - 1, 0)).replace(/[^\t]/g, " ");
					const numberOfMarkers = hasMarker[1] || 1;
					markerLine = [
						"\n ",
						defs.gutter(gutter.replace(/\d/g, " ")),
						" ",
						markerSpacing,
						defs.marker("^").repeat(numberOfMarkers)
					].join("");
					if (lastMarkerLine && opts.message) markerLine += " " + defs.message(opts.message);
				}
				return [
					defs.marker(">"),
					defs.gutter(gutter),
					line.length > 0 ? ` ${line}` : "",
					markerLine
				].join("");
			} else return ` ${defs.gutter(gutter)}${line.length > 0 ? ` ${line}` : ""}`;
		}).join("\n");
		if (opts.message && !hasColumns) frame = `${" ".repeat(numberMaxWidth + 1)}${opts.message}\n${frame}`;
		if (shouldHighlight) return defs.reset(frame);
		else return frame;
	}
	function index(rawLines, lineNumber, colNumber, opts = {}) {
		if (!deprecationWarningShown) {
			deprecationWarningShown = true;
			const message = "Passing lineNumber and colNumber is deprecated to @babel/code-frame. Please use `codeFrameColumns`.";
			if (process.emitWarning) process.emitWarning(message, "DeprecationWarning");
			else {
				const deprecationError = new Error(message);
				deprecationError.name = "DeprecationWarning";
				console.warn(new Error(message));
			}
		}
		colNumber = Math.max(colNumber, 0);
		const location = { start: {
			column: colNumber,
			line: lineNumber
		} };
		return codeFrameColumns$1(rawLines, location, opts);
	}
	exports.codeFrameColumns = codeFrameColumns$1;
	exports.default = index;
	exports.highlight = highlight;
}) });

//#endregion
//#region ../../../node_modules/.pnpm/index-to-position@1.1.0/node_modules/index-to-position/index.js
function getPosition(text, textIndex) {
	const lineBreakBefore = textIndex === 0 ? -1 : text.lastIndexOf("\n", textIndex - 1);
	return {
		line: lineBreakBefore === -1 ? 0 : text.slice(0, lineBreakBefore + 1).match(/\n/g).length,
		column: textIndex - lineBreakBefore - 1
	};
}
function indexToPosition(text, textIndex, { oneBased = false } = {}) {
	if (typeof text !== "string") throw new TypeError("Text parameter should be a string");
	if (!Number.isInteger(textIndex)) throw new TypeError("Index parameter should be an integer");
	if (textIndex < 0 || textIndex > text.length) throw new RangeError("Index out of bounds");
	const position = getPosition(text, textIndex);
	return oneBased ? {
		line: position.line + 1,
		column: position.column + 1
	} : position;
}
var init_index_to_position = __esm({ "../../../node_modules/.pnpm/index-to-position@1.1.0/node_modules/index-to-position/index.js": (() => {}) });

//#endregion
//#region ../../../node_modules/.pnpm/parse-json@8.3.0/node_modules/parse-json/index.js
function parseJson(string, reviver, fileName) {
	if (typeof reviver === "string") {
		fileName = reviver;
		reviver = void 0;
	}
	try {
		return JSON.parse(string, reviver);
	} catch (error) {
		throw new JSONError({
			jsonParseError: error,
			fileName,
			input: string
		});
	}
}
var import_lib, getCodePoint, JSONError, getErrorLocation, addCodePointToUnexpectedToken;
var init_parse_json = __esm({ "../../../node_modules/.pnpm/parse-json@8.3.0/node_modules/parse-json/index.js": (() => {
	import_lib = /* @__PURE__ */ __toESM(require_lib$1(), 1);
	init_index_to_position();
	getCodePoint = (character) => `\\u{${character.codePointAt(0).toString(16)}}`;
	JSONError = class JSONError extends Error {
		name = "JSONError";
		fileName;
		#input;
		#jsonParseError;
		#message;
		#codeFrame;
		#rawCodeFrame;
		constructor(messageOrOptions) {
			if (typeof messageOrOptions === "string") {
				super();
				this.#message = messageOrOptions;
			} else {
				const { jsonParseError, fileName, input } = messageOrOptions;
				super(void 0, { cause: jsonParseError });
				this.#input = input;
				this.#jsonParseError = jsonParseError;
				this.fileName = fileName;
			}
			Error.captureStackTrace?.(this, JSONError);
		}
		get message() {
			this.#message ??= `${addCodePointToUnexpectedToken(this.#jsonParseError.message)}${this.#input === "" ? " while parsing empty string" : ""}`;
			const { codeFrame } = this;
			return `${this.#message}${this.fileName ? ` in ${this.fileName}` : ""}${codeFrame ? `\n\n${codeFrame}\n` : ""}`;
		}
		set message(message) {
			this.#message = message;
		}
		#getCodeFrame(highlightCode) {
			if (!this.#jsonParseError) return;
			const input = this.#input;
			const location = getErrorLocation(input, this.#jsonParseError.message);
			if (!location) return;
			return (0, import_lib.codeFrameColumns)(input, { start: location }, { highlightCode });
		}
		get codeFrame() {
			this.#codeFrame ??= this.#getCodeFrame(true);
			return this.#codeFrame;
		}
		get rawCodeFrame() {
			this.#rawCodeFrame ??= this.#getCodeFrame(false);
			return this.#rawCodeFrame;
		}
	};
	getErrorLocation = (string, message) => {
		const match = message.match(/in JSON at position (?<index>\d+)(?: \(line (?<line>\d+) column (?<column>\d+)\))?$/);
		if (!match) return;
		const { index: index$1, line, column } = match.groups;
		if (line && column) return {
			line: Number(line),
			column: Number(column)
		};
		return indexToPosition(string, Number(index$1), { oneBased: true });
	};
	addCodePointToUnexpectedToken = (message) => message.replace(/(?<=^Unexpected token )(?<quote>')?(.)\k<quote>/, (_, _quote, token) => `"${token}"(${getCodePoint(token)})`);
}) });

//#endregion
//#region ../../../node_modules/.pnpm/semver@7.7.2/node_modules/semver/internal/debug.js
var require_debug = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/semver@7.7.2/node_modules/semver/internal/debug.js": ((exports, module) => {
	const debug$2 = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {};
	module.exports = debug$2;
}) });

//#endregion
//#region ../../../node_modules/.pnpm/semver@7.7.2/node_modules/semver/internal/constants.js
var require_constants = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/semver@7.7.2/node_modules/semver/internal/constants.js": ((exports, module) => {
	const SEMVER_SPEC_VERSION = "2.0.0";
	const MAX_LENGTH$2 = 256;
	const MAX_SAFE_INTEGER$1 = Number.MAX_SAFE_INTEGER || 9007199254740991;
	const MAX_SAFE_COMPONENT_LENGTH$1 = 16;
	const MAX_SAFE_BUILD_LENGTH$1 = MAX_LENGTH$2 - 6;
	const RELEASE_TYPES = [
		"major",
		"premajor",
		"minor",
		"preminor",
		"patch",
		"prepatch",
		"prerelease"
	];
	module.exports = {
		MAX_LENGTH: MAX_LENGTH$2,
		MAX_SAFE_COMPONENT_LENGTH: MAX_SAFE_COMPONENT_LENGTH$1,
		MAX_SAFE_BUILD_LENGTH: MAX_SAFE_BUILD_LENGTH$1,
		MAX_SAFE_INTEGER: MAX_SAFE_INTEGER$1,
		RELEASE_TYPES,
		SEMVER_SPEC_VERSION,
		FLAG_INCLUDE_PRERELEASE: 1,
		FLAG_LOOSE: 2
	};
}) });

//#endregion
//#region ../../../node_modules/.pnpm/semver@7.7.2/node_modules/semver/internal/re.js
var require_re = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/semver@7.7.2/node_modules/semver/internal/re.js": ((exports, module) => {
	const { MAX_SAFE_COMPONENT_LENGTH, MAX_SAFE_BUILD_LENGTH, MAX_LENGTH: MAX_LENGTH$1 } = require_constants();
	const debug$1 = require_debug();
	exports = module.exports = {};
	const re$1 = exports.re = [];
	const safeRe = exports.safeRe = [];
	const src = exports.src = [];
	const safeSrc = exports.safeSrc = [];
	const t$1 = exports.t = {};
	let R = 0;
	const LETTERDASHNUMBER = "[a-zA-Z0-9-]";
	const safeRegexReplacements = [
		["\\s", 1],
		["\\d", MAX_LENGTH$1],
		[LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH]
	];
	const makeSafeRegex = (value) => {
		for (const [token, max] of safeRegexReplacements) value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
		return value;
	};
	const createToken = (name, value, isGlobal) => {
		const safe = makeSafeRegex(value);
		const index$1 = R++;
		debug$1(name, index$1, value);
		t$1[name] = index$1;
		src[index$1] = value;
		safeSrc[index$1] = safe;
		re$1[index$1] = new RegExp(value, isGlobal ? "g" : void 0);
		safeRe[index$1] = new RegExp(safe, isGlobal ? "g" : void 0);
	};
	createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*");
	createToken("NUMERICIDENTIFIERLOOSE", "\\d+");
	createToken("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
	createToken("MAINVERSION", `(${src[t$1.NUMERICIDENTIFIER]})\\.(${src[t$1.NUMERICIDENTIFIER]})\\.(${src[t$1.NUMERICIDENTIFIER]})`);
	createToken("MAINVERSIONLOOSE", `(${src[t$1.NUMERICIDENTIFIERLOOSE]})\\.(${src[t$1.NUMERICIDENTIFIERLOOSE]})\\.(${src[t$1.NUMERICIDENTIFIERLOOSE]})`);
	createToken("PRERELEASEIDENTIFIER", `(?:${src[t$1.NONNUMERICIDENTIFIER]}|${src[t$1.NUMERICIDENTIFIER]})`);
	createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src[t$1.NONNUMERICIDENTIFIER]}|${src[t$1.NUMERICIDENTIFIERLOOSE]})`);
	createToken("PRERELEASE", `(?:-(${src[t$1.PRERELEASEIDENTIFIER]}(?:\\.${src[t$1.PRERELEASEIDENTIFIER]})*))`);
	createToken("PRERELEASELOOSE", `(?:-?(${src[t$1.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t$1.PRERELEASEIDENTIFIERLOOSE]})*))`);
	createToken("BUILDIDENTIFIER", `${LETTERDASHNUMBER}+`);
	createToken("BUILD", `(?:\\+(${src[t$1.BUILDIDENTIFIER]}(?:\\.${src[t$1.BUILDIDENTIFIER]})*))`);
	createToken("FULLPLAIN", `v?${src[t$1.MAINVERSION]}${src[t$1.PRERELEASE]}?${src[t$1.BUILD]}?`);
	createToken("FULL", `^${src[t$1.FULLPLAIN]}$`);
	createToken("LOOSEPLAIN", `[v=\\s]*${src[t$1.MAINVERSIONLOOSE]}${src[t$1.PRERELEASELOOSE]}?${src[t$1.BUILD]}?`);
	createToken("LOOSE", `^${src[t$1.LOOSEPLAIN]}$`);
	createToken("GTLT", "((?:<|>)?=?)");
	createToken("XRANGEIDENTIFIERLOOSE", `${src[t$1.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
	createToken("XRANGEIDENTIFIER", `${src[t$1.NUMERICIDENTIFIER]}|x|X|\\*`);
	createToken("XRANGEPLAIN", `[v=\\s]*(${src[t$1.XRANGEIDENTIFIER]})(?:\\.(${src[t$1.XRANGEIDENTIFIER]})(?:\\.(${src[t$1.XRANGEIDENTIFIER]})(?:${src[t$1.PRERELEASE]})?${src[t$1.BUILD]}?)?)?`);
	createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src[t$1.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t$1.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t$1.XRANGEIDENTIFIERLOOSE]})(?:${src[t$1.PRERELEASELOOSE]})?${src[t$1.BUILD]}?)?)?`);
	createToken("XRANGE", `^${src[t$1.GTLT]}\\s*${src[t$1.XRANGEPLAIN]}$`);
	createToken("XRANGELOOSE", `^${src[t$1.GTLT]}\\s*${src[t$1.XRANGEPLAINLOOSE]}$`);
	createToken("COERCEPLAIN", `(^|[^\\d])(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
	createToken("COERCE", `${src[t$1.COERCEPLAIN]}(?:$|[^\\d])`);
	createToken("COERCEFULL", src[t$1.COERCEPLAIN] + `(?:${src[t$1.PRERELEASE]})?(?:${src[t$1.BUILD]})?(?:$|[^\\d])`);
	createToken("COERCERTL", src[t$1.COERCE], true);
	createToken("COERCERTLFULL", src[t$1.COERCEFULL], true);
	createToken("LONETILDE", "(?:~>?)");
	createToken("TILDETRIM", `(\\s*)${src[t$1.LONETILDE]}\\s+`, true);
	exports.tildeTrimReplace = "$1~";
	createToken("TILDE", `^${src[t$1.LONETILDE]}${src[t$1.XRANGEPLAIN]}$`);
	createToken("TILDELOOSE", `^${src[t$1.LONETILDE]}${src[t$1.XRANGEPLAINLOOSE]}$`);
	createToken("LONECARET", "(?:\\^)");
	createToken("CARETTRIM", `(\\s*)${src[t$1.LONECARET]}\\s+`, true);
	exports.caretTrimReplace = "$1^";
	createToken("CARET", `^${src[t$1.LONECARET]}${src[t$1.XRANGEPLAIN]}$`);
	createToken("CARETLOOSE", `^${src[t$1.LONECARET]}${src[t$1.XRANGEPLAINLOOSE]}$`);
	createToken("COMPARATORLOOSE", `^${src[t$1.GTLT]}\\s*(${src[t$1.LOOSEPLAIN]})$|^$`);
	createToken("COMPARATOR", `^${src[t$1.GTLT]}\\s*(${src[t$1.FULLPLAIN]})$|^$`);
	createToken("COMPARATORTRIM", `(\\s*)${src[t$1.GTLT]}\\s*(${src[t$1.LOOSEPLAIN]}|${src[t$1.XRANGEPLAIN]})`, true);
	exports.comparatorTrimReplace = "$1$2$3";
	createToken("HYPHENRANGE", `^\\s*(${src[t$1.XRANGEPLAIN]})\\s+-\\s+(${src[t$1.XRANGEPLAIN]})\\s*$`);
	createToken("HYPHENRANGELOOSE", `^\\s*(${src[t$1.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t$1.XRANGEPLAINLOOSE]})\\s*$`);
	createToken("STAR", "(<|>)?=?\\s*\\*");
	createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$");
	createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
}) });

//#endregion
//#region ../../../node_modules/.pnpm/semver@7.7.2/node_modules/semver/internal/parse-options.js
var require_parse_options = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/semver@7.7.2/node_modules/semver/internal/parse-options.js": ((exports, module) => {
	const looseOption = Object.freeze({ loose: true });
	const emptyOpts = Object.freeze({});
	const parseOptions$1 = (options) => {
		if (!options) return emptyOpts;
		if (typeof options !== "object") return looseOption;
		return options;
	};
	module.exports = parseOptions$1;
}) });

//#endregion
//#region ../../../node_modules/.pnpm/semver@7.7.2/node_modules/semver/internal/identifiers.js
var require_identifiers = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/semver@7.7.2/node_modules/semver/internal/identifiers.js": ((exports, module) => {
	const numeric = /^[0-9]+$/;
	const compareIdentifiers$1 = (a, b) => {
		const anum = numeric.test(a);
		const bnum = numeric.test(b);
		if (anum && bnum) {
			a = +a;
			b = +b;
		}
		return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
	};
	const rcompareIdentifiers = (a, b) => compareIdentifiers$1(b, a);
	module.exports = {
		compareIdentifiers: compareIdentifiers$1,
		rcompareIdentifiers
	};
}) });

//#endregion
//#region ../../../node_modules/.pnpm/semver@7.7.2/node_modules/semver/classes/semver.js
var require_semver = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/semver@7.7.2/node_modules/semver/classes/semver.js": ((exports, module) => {
	const debug = require_debug();
	const { MAX_LENGTH, MAX_SAFE_INTEGER } = require_constants();
	const { safeRe: re, t } = require_re();
	const parseOptions = require_parse_options();
	const { compareIdentifiers } = require_identifiers();
	var SemVer$1 = class SemVer$1 {
		constructor(version, options) {
			options = parseOptions(options);
			if (version instanceof SemVer$1) if (version.loose === !!options.loose && version.includePrerelease === !!options.includePrerelease) return version;
			else version = version.version;
			else if (typeof version !== "string") throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`);
			if (version.length > MAX_LENGTH) throw new TypeError(`version is longer than ${MAX_LENGTH} characters`);
			debug("SemVer", version, options);
			this.options = options;
			this.loose = !!options.loose;
			this.includePrerelease = !!options.includePrerelease;
			const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);
			if (!m) throw new TypeError(`Invalid Version: ${version}`);
			this.raw = version;
			this.major = +m[1];
			this.minor = +m[2];
			this.patch = +m[3];
			if (this.major > MAX_SAFE_INTEGER || this.major < 0) throw new TypeError("Invalid major version");
			if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) throw new TypeError("Invalid minor version");
			if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) throw new TypeError("Invalid patch version");
			if (!m[4]) this.prerelease = [];
			else this.prerelease = m[4].split(".").map((id) => {
				if (/^[0-9]+$/.test(id)) {
					const num = +id;
					if (num >= 0 && num < MAX_SAFE_INTEGER) return num;
				}
				return id;
			});
			this.build = m[5] ? m[5].split(".") : [];
			this.format();
		}
		format() {
			this.version = `${this.major}.${this.minor}.${this.patch}`;
			if (this.prerelease.length) this.version += `-${this.prerelease.join(".")}`;
			return this.version;
		}
		toString() {
			return this.version;
		}
		compare(other) {
			debug("SemVer.compare", this.version, this.options, other);
			if (!(other instanceof SemVer$1)) {
				if (typeof other === "string" && other === this.version) return 0;
				other = new SemVer$1(other, this.options);
			}
			if (other.version === this.version) return 0;
			return this.compareMain(other) || this.comparePre(other);
		}
		compareMain(other) {
			if (!(other instanceof SemVer$1)) other = new SemVer$1(other, this.options);
			return compareIdentifiers(this.major, other.major) || compareIdentifiers(this.minor, other.minor) || compareIdentifiers(this.patch, other.patch);
		}
		comparePre(other) {
			if (!(other instanceof SemVer$1)) other = new SemVer$1(other, this.options);
			if (this.prerelease.length && !other.prerelease.length) return -1;
			else if (!this.prerelease.length && other.prerelease.length) return 1;
			else if (!this.prerelease.length && !other.prerelease.length) return 0;
			let i = 0;
			do {
				const a = this.prerelease[i];
				const b = other.prerelease[i];
				debug("prerelease compare", i, a, b);
				if (a === void 0 && b === void 0) return 0;
				else if (b === void 0) return 1;
				else if (a === void 0) return -1;
				else if (a === b) continue;
				else return compareIdentifiers(a, b);
			} while (++i);
		}
		compareBuild(other) {
			if (!(other instanceof SemVer$1)) other = new SemVer$1(other, this.options);
			let i = 0;
			do {
				const a = this.build[i];
				const b = other.build[i];
				debug("build compare", i, a, b);
				if (a === void 0 && b === void 0) return 0;
				else if (b === void 0) return 1;
				else if (a === void 0) return -1;
				else if (a === b) continue;
				else return compareIdentifiers(a, b);
			} while (++i);
		}
		inc(release, identifier, identifierBase) {
			if (release.startsWith("pre")) {
				if (!identifier && identifierBase === false) throw new Error("invalid increment argument: identifier is empty");
				if (identifier) {
					const match = `-${identifier}`.match(this.options.loose ? re[t.PRERELEASELOOSE] : re[t.PRERELEASE]);
					if (!match || match[1] !== identifier) throw new Error(`invalid identifier: ${identifier}`);
				}
			}
			switch (release) {
				case "premajor":
					this.prerelease.length = 0;
					this.patch = 0;
					this.minor = 0;
					this.major++;
					this.inc("pre", identifier, identifierBase);
					break;
				case "preminor":
					this.prerelease.length = 0;
					this.patch = 0;
					this.minor++;
					this.inc("pre", identifier, identifierBase);
					break;
				case "prepatch":
					this.prerelease.length = 0;
					this.inc("patch", identifier, identifierBase);
					this.inc("pre", identifier, identifierBase);
					break;
				case "prerelease":
					if (this.prerelease.length === 0) this.inc("patch", identifier, identifierBase);
					this.inc("pre", identifier, identifierBase);
					break;
				case "release":
					if (this.prerelease.length === 0) throw new Error(`version ${this.raw} is not a prerelease`);
					this.prerelease.length = 0;
					break;
				case "major":
					if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) this.major++;
					this.minor = 0;
					this.patch = 0;
					this.prerelease = [];
					break;
				case "minor":
					if (this.patch !== 0 || this.prerelease.length === 0) this.minor++;
					this.patch = 0;
					this.prerelease = [];
					break;
				case "patch":
					if (this.prerelease.length === 0) this.patch++;
					this.prerelease = [];
					break;
				case "pre": {
					const base = Number(identifierBase) ? 1 : 0;
					if (this.prerelease.length === 0) this.prerelease = [base];
					else {
						let i = this.prerelease.length;
						while (--i >= 0) if (typeof this.prerelease[i] === "number") {
							this.prerelease[i]++;
							i = -2;
						}
						if (i === -1) {
							if (identifier === this.prerelease.join(".") && identifierBase === false) throw new Error("invalid increment argument: identifier already exists");
							this.prerelease.push(base);
						}
					}
					if (identifier) {
						let prerelease = [identifier, base];
						if (identifierBase === false) prerelease = [identifier];
						if (compareIdentifiers(this.prerelease[0], identifier) === 0) {
							if (isNaN(this.prerelease[1])) this.prerelease = prerelease;
						} else this.prerelease = prerelease;
					}
					break;
				}
				default: throw new Error(`invalid increment argument: ${release}`);
			}
			this.raw = this.format();
			if (this.build.length) this.raw += `+${this.build.join(".")}`;
			return this;
		}
	};
	module.exports = SemVer$1;
}) });

//#endregion
//#region ../../../node_modules/.pnpm/semver@7.7.2/node_modules/semver/functions/parse.js
var require_parse$1 = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/semver@7.7.2/node_modules/semver/functions/parse.js": ((exports, module) => {
	const SemVer = require_semver();
	const parse$5 = (version, options, throwErrors = false) => {
		if (version instanceof SemVer) return version;
		try {
			return new SemVer(version, options);
		} catch (er) {
			if (!throwErrors) return null;
			throw er;
		}
	};
	module.exports = parse$5;
}) });

//#endregion
//#region ../../../node_modules/.pnpm/semver@7.7.2/node_modules/semver/functions/valid.js
var require_valid = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/semver@7.7.2/node_modules/semver/functions/valid.js": ((exports, module) => {
	const parse$4 = require_parse$1();
	const valid$1 = (version, options) => {
		const v = parse$4(version, options);
		return v ? v.version : null;
	};
	module.exports = valid$1;
}) });

//#endregion
//#region ../../../node_modules/.pnpm/semver@7.7.2/node_modules/semver/functions/clean.js
var require_clean = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/semver@7.7.2/node_modules/semver/functions/clean.js": ((exports, module) => {
	const parse$3 = require_parse$1();
	const clean = (version, options) => {
		const s = parse$3(version.trim().replace(/^[=v]+/, ""), options);
		return s ? s.version : null;
	};
	module.exports = clean;
}) });

//#endregion
//#region ../../../node_modules/.pnpm/spdx-license-ids@3.0.22/node_modules/spdx-license-ids/index.json
var require_spdx_license_ids = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/spdx-license-ids@3.0.22/node_modules/spdx-license-ids/index.json": ((exports, module) => {
	module.exports = [
		"0BSD",
		"3D-Slicer-1.0",
		"AAL",
		"ADSL",
		"AFL-1.1",
		"AFL-1.2",
		"AFL-2.0",
		"AFL-2.1",
		"AFL-3.0",
		"AGPL-1.0-only",
		"AGPL-1.0-or-later",
		"AGPL-3.0-only",
		"AGPL-3.0-or-later",
		"AMD-newlib",
		"AMDPLPA",
		"AML",
		"AML-glslang",
		"AMPAS",
		"ANTLR-PD",
		"ANTLR-PD-fallback",
		"APAFML",
		"APL-1.0",
		"APSL-1.0",
		"APSL-1.1",
		"APSL-1.2",
		"APSL-2.0",
		"ASWF-Digital-Assets-1.0",
		"ASWF-Digital-Assets-1.1",
		"Abstyles",
		"AdaCore-doc",
		"Adobe-2006",
		"Adobe-Display-PostScript",
		"Adobe-Glyph",
		"Adobe-Utopia",
		"Afmparse",
		"Aladdin",
		"Apache-1.0",
		"Apache-1.1",
		"Apache-2.0",
		"App-s2p",
		"Arphic-1999",
		"Artistic-1.0",
		"Artistic-1.0-Perl",
		"Artistic-1.0-cl8",
		"Artistic-2.0",
		"Artistic-dist",
		"Aspell-RU",
		"BSD-1-Clause",
		"BSD-2-Clause",
		"BSD-2-Clause-Darwin",
		"BSD-2-Clause-Patent",
		"BSD-2-Clause-Views",
		"BSD-2-Clause-first-lines",
		"BSD-2-Clause-pkgconf-disclaimer",
		"BSD-3-Clause",
		"BSD-3-Clause-Attribution",
		"BSD-3-Clause-Clear",
		"BSD-3-Clause-HP",
		"BSD-3-Clause-LBNL",
		"BSD-3-Clause-Modification",
		"BSD-3-Clause-No-Military-License",
		"BSD-3-Clause-No-Nuclear-License",
		"BSD-3-Clause-No-Nuclear-License-2014",
		"BSD-3-Clause-No-Nuclear-Warranty",
		"BSD-3-Clause-Open-MPI",
		"BSD-3-Clause-Sun",
		"BSD-3-Clause-acpica",
		"BSD-3-Clause-flex",
		"BSD-4-Clause",
		"BSD-4-Clause-Shortened",
		"BSD-4-Clause-UC",
		"BSD-4.3RENO",
		"BSD-4.3TAHOE",
		"BSD-Advertising-Acknowledgement",
		"BSD-Attribution-HPND-disclaimer",
		"BSD-Inferno-Nettverk",
		"BSD-Protection",
		"BSD-Source-Code",
		"BSD-Source-beginning-file",
		"BSD-Systemics",
		"BSD-Systemics-W3Works",
		"BSL-1.0",
		"BUSL-1.1",
		"Baekmuk",
		"Bahyph",
		"Barr",
		"Beerware",
		"BitTorrent-1.0",
		"BitTorrent-1.1",
		"Bitstream-Charter",
		"Bitstream-Vera",
		"BlueOak-1.0.0",
		"Boehm-GC",
		"Boehm-GC-without-fee",
		"Borceux",
		"Brian-Gladman-2-Clause",
		"Brian-Gladman-3-Clause",
		"C-UDA-1.0",
		"CAL-1.0",
		"CAL-1.0-Combined-Work-Exception",
		"CATOSL-1.1",
		"CC-BY-1.0",
		"CC-BY-2.0",
		"CC-BY-2.5",
		"CC-BY-2.5-AU",
		"CC-BY-3.0",
		"CC-BY-3.0-AT",
		"CC-BY-3.0-AU",
		"CC-BY-3.0-DE",
		"CC-BY-3.0-IGO",
		"CC-BY-3.0-NL",
		"CC-BY-3.0-US",
		"CC-BY-4.0",
		"CC-BY-NC-1.0",
		"CC-BY-NC-2.0",
		"CC-BY-NC-2.5",
		"CC-BY-NC-3.0",
		"CC-BY-NC-3.0-DE",
		"CC-BY-NC-4.0",
		"CC-BY-NC-ND-1.0",
		"CC-BY-NC-ND-2.0",
		"CC-BY-NC-ND-2.5",
		"CC-BY-NC-ND-3.0",
		"CC-BY-NC-ND-3.0-DE",
		"CC-BY-NC-ND-3.0-IGO",
		"CC-BY-NC-ND-4.0",
		"CC-BY-NC-SA-1.0",
		"CC-BY-NC-SA-2.0",
		"CC-BY-NC-SA-2.0-DE",
		"CC-BY-NC-SA-2.0-FR",
		"CC-BY-NC-SA-2.0-UK",
		"CC-BY-NC-SA-2.5",
		"CC-BY-NC-SA-3.0",
		"CC-BY-NC-SA-3.0-DE",
		"CC-BY-NC-SA-3.0-IGO",
		"CC-BY-NC-SA-4.0",
		"CC-BY-ND-1.0",
		"CC-BY-ND-2.0",
		"CC-BY-ND-2.5",
		"CC-BY-ND-3.0",
		"CC-BY-ND-3.0-DE",
		"CC-BY-ND-4.0",
		"CC-BY-SA-1.0",
		"CC-BY-SA-2.0",
		"CC-BY-SA-2.0-UK",
		"CC-BY-SA-2.1-JP",
		"CC-BY-SA-2.5",
		"CC-BY-SA-3.0",
		"CC-BY-SA-3.0-AT",
		"CC-BY-SA-3.0-DE",
		"CC-BY-SA-3.0-IGO",
		"CC-BY-SA-4.0",
		"CC-PDDC",
		"CC-PDM-1.0",
		"CC-SA-1.0",
		"CC0-1.0",
		"CDDL-1.0",
		"CDDL-1.1",
		"CDL-1.0",
		"CDLA-Permissive-1.0",
		"CDLA-Permissive-2.0",
		"CDLA-Sharing-1.0",
		"CECILL-1.0",
		"CECILL-1.1",
		"CECILL-2.0",
		"CECILL-2.1",
		"CECILL-B",
		"CECILL-C",
		"CERN-OHL-1.1",
		"CERN-OHL-1.2",
		"CERN-OHL-P-2.0",
		"CERN-OHL-S-2.0",
		"CERN-OHL-W-2.0",
		"CFITSIO",
		"CMU-Mach",
		"CMU-Mach-nodoc",
		"CNRI-Jython",
		"CNRI-Python",
		"CNRI-Python-GPL-Compatible",
		"COIL-1.0",
		"CPAL-1.0",
		"CPL-1.0",
		"CPOL-1.02",
		"CUA-OPL-1.0",
		"Caldera",
		"Caldera-no-preamble",
		"Catharon",
		"ClArtistic",
		"Clips",
		"Community-Spec-1.0",
		"Condor-1.1",
		"Cornell-Lossless-JPEG",
		"Cronyx",
		"Crossword",
		"CryptoSwift",
		"CrystalStacker",
		"Cube",
		"D-FSL-1.0",
		"DEC-3-Clause",
		"DL-DE-BY-2.0",
		"DL-DE-ZERO-2.0",
		"DOC",
		"DRL-1.0",
		"DRL-1.1",
		"DSDP",
		"DocBook-DTD",
		"DocBook-Schema",
		"DocBook-Stylesheet",
		"DocBook-XML",
		"Dotseqn",
		"ECL-1.0",
		"ECL-2.0",
		"EFL-1.0",
		"EFL-2.0",
		"EPICS",
		"EPL-1.0",
		"EPL-2.0",
		"EUDatagrid",
		"EUPL-1.0",
		"EUPL-1.1",
		"EUPL-1.2",
		"Elastic-2.0",
		"Entessa",
		"ErlPL-1.1",
		"Eurosym",
		"FBM",
		"FDK-AAC",
		"FSFAP",
		"FSFAP-no-warranty-disclaimer",
		"FSFUL",
		"FSFULLR",
		"FSFULLRSD",
		"FSFULLRWD",
		"FSL-1.1-ALv2",
		"FSL-1.1-MIT",
		"FTL",
		"Fair",
		"Ferguson-Twofish",
		"Frameworx-1.0",
		"FreeBSD-DOC",
		"FreeImage",
		"Furuseth",
		"GCR-docs",
		"GD",
		"GFDL-1.1-invariants-only",
		"GFDL-1.1-invariants-or-later",
		"GFDL-1.1-no-invariants-only",
		"GFDL-1.1-no-invariants-or-later",
		"GFDL-1.1-only",
		"GFDL-1.1-or-later",
		"GFDL-1.2-invariants-only",
		"GFDL-1.2-invariants-or-later",
		"GFDL-1.2-no-invariants-only",
		"GFDL-1.2-no-invariants-or-later",
		"GFDL-1.2-only",
		"GFDL-1.2-or-later",
		"GFDL-1.3-invariants-only",
		"GFDL-1.3-invariants-or-later",
		"GFDL-1.3-no-invariants-only",
		"GFDL-1.3-no-invariants-or-later",
		"GFDL-1.3-only",
		"GFDL-1.3-or-later",
		"GL2PS",
		"GLWTPL",
		"GPL-1.0-only",
		"GPL-1.0-or-later",
		"GPL-2.0-only",
		"GPL-2.0-or-later",
		"GPL-3.0-only",
		"GPL-3.0-or-later",
		"Game-Programming-Gems",
		"Giftware",
		"Glide",
		"Glulxe",
		"Graphics-Gems",
		"Gutmann",
		"HDF5",
		"HIDAPI",
		"HP-1986",
		"HP-1989",
		"HPND",
		"HPND-DEC",
		"HPND-Fenneberg-Livingston",
		"HPND-INRIA-IMAG",
		"HPND-Intel",
		"HPND-Kevlin-Henney",
		"HPND-MIT-disclaimer",
		"HPND-Markus-Kuhn",
		"HPND-Netrek",
		"HPND-Pbmplus",
		"HPND-UC",
		"HPND-UC-export-US",
		"HPND-doc",
		"HPND-doc-sell",
		"HPND-export-US",
		"HPND-export-US-acknowledgement",
		"HPND-export-US-modify",
		"HPND-export2-US",
		"HPND-merchantability-variant",
		"HPND-sell-MIT-disclaimer-xserver",
		"HPND-sell-regexpr",
		"HPND-sell-variant",
		"HPND-sell-variant-MIT-disclaimer",
		"HPND-sell-variant-MIT-disclaimer-rev",
		"HTMLTIDY",
		"HaskellReport",
		"Hippocratic-2.1",
		"IBM-pibs",
		"ICU",
		"IEC-Code-Components-EULA",
		"IJG",
		"IJG-short",
		"IPA",
		"IPL-1.0",
		"ISC",
		"ISC-Veillard",
		"ImageMagick",
		"Imlib2",
		"Info-ZIP",
		"Inner-Net-2.0",
		"InnoSetup",
		"Intel",
		"Intel-ACPI",
		"Interbase-1.0",
		"JPL-image",
		"JPNIC",
		"JSON",
		"Jam",
		"JasPer-2.0",
		"Kastrup",
		"Kazlib",
		"Knuth-CTAN",
		"LAL-1.2",
		"LAL-1.3",
		"LGPL-2.0-only",
		"LGPL-2.0-or-later",
		"LGPL-2.1-only",
		"LGPL-2.1-or-later",
		"LGPL-3.0-only",
		"LGPL-3.0-or-later",
		"LGPLLR",
		"LOOP",
		"LPD-document",
		"LPL-1.0",
		"LPL-1.02",
		"LPPL-1.0",
		"LPPL-1.1",
		"LPPL-1.2",
		"LPPL-1.3a",
		"LPPL-1.3c",
		"LZMA-SDK-9.11-to-9.20",
		"LZMA-SDK-9.22",
		"Latex2e",
		"Latex2e-translated-notice",
		"Leptonica",
		"LiLiQ-P-1.1",
		"LiLiQ-R-1.1",
		"LiLiQ-Rplus-1.1",
		"Libpng",
		"Linux-OpenIB",
		"Linux-man-pages-1-para",
		"Linux-man-pages-copyleft",
		"Linux-man-pages-copyleft-2-para",
		"Linux-man-pages-copyleft-var",
		"Lucida-Bitmap-Fonts",
		"MIPS",
		"MIT",
		"MIT-0",
		"MIT-CMU",
		"MIT-Click",
		"MIT-Festival",
		"MIT-Khronos-old",
		"MIT-Modern-Variant",
		"MIT-Wu",
		"MIT-advertising",
		"MIT-enna",
		"MIT-feh",
		"MIT-open-group",
		"MIT-testregex",
		"MITNFA",
		"MMIXware",
		"MPEG-SSG",
		"MPL-1.0",
		"MPL-1.1",
		"MPL-2.0",
		"MPL-2.0-no-copyleft-exception",
		"MS-LPL",
		"MS-PL",
		"MS-RL",
		"MTLL",
		"Mackerras-3-Clause",
		"Mackerras-3-Clause-acknowledgment",
		"MakeIndex",
		"Martin-Birgmeier",
		"McPhee-slideshow",
		"Minpack",
		"MirOS",
		"Motosoto",
		"MulanPSL-1.0",
		"MulanPSL-2.0",
		"Multics",
		"Mup",
		"NAIST-2003",
		"NASA-1.3",
		"NBPL-1.0",
		"NCBI-PD",
		"NCGL-UK-2.0",
		"NCL",
		"NCSA",
		"NGPL",
		"NICTA-1.0",
		"NIST-PD",
		"NIST-PD-fallback",
		"NIST-Software",
		"NLOD-1.0",
		"NLOD-2.0",
		"NLPL",
		"NOSL",
		"NPL-1.0",
		"NPL-1.1",
		"NPOSL-3.0",
		"NRL",
		"NTIA-PD",
		"NTP",
		"NTP-0",
		"Naumen",
		"NetCDF",
		"Newsletr",
		"Nokia",
		"Noweb",
		"O-UDA-1.0",
		"OAR",
		"OCCT-PL",
		"OCLC-2.0",
		"ODC-By-1.0",
		"ODbL-1.0",
		"OFFIS",
		"OFL-1.0",
		"OFL-1.0-RFN",
		"OFL-1.0-no-RFN",
		"OFL-1.1",
		"OFL-1.1-RFN",
		"OFL-1.1-no-RFN",
		"OGC-1.0",
		"OGDL-Taiwan-1.0",
		"OGL-Canada-2.0",
		"OGL-UK-1.0",
		"OGL-UK-2.0",
		"OGL-UK-3.0",
		"OGTSL",
		"OLDAP-1.1",
		"OLDAP-1.2",
		"OLDAP-1.3",
		"OLDAP-1.4",
		"OLDAP-2.0",
		"OLDAP-2.0.1",
		"OLDAP-2.1",
		"OLDAP-2.2",
		"OLDAP-2.2.1",
		"OLDAP-2.2.2",
		"OLDAP-2.3",
		"OLDAP-2.4",
		"OLDAP-2.5",
		"OLDAP-2.6",
		"OLDAP-2.7",
		"OLDAP-2.8",
		"OLFL-1.3",
		"OML",
		"OPL-1.0",
		"OPL-UK-3.0",
		"OPUBL-1.0",
		"OSET-PL-2.1",
		"OSL-1.0",
		"OSL-1.1",
		"OSL-2.0",
		"OSL-2.1",
		"OSL-3.0",
		"OpenPBS-2.3",
		"OpenSSL",
		"OpenSSL-standalone",
		"OpenVision",
		"PADL",
		"PDDL-1.0",
		"PHP-3.0",
		"PHP-3.01",
		"PPL",
		"PSF-2.0",
		"Parity-6.0.0",
		"Parity-7.0.0",
		"Pixar",
		"Plexus",
		"PolyForm-Noncommercial-1.0.0",
		"PolyForm-Small-Business-1.0.0",
		"PostgreSQL",
		"Python-2.0",
		"Python-2.0.1",
		"QPL-1.0",
		"QPL-1.0-INRIA-2004",
		"Qhull",
		"RHeCos-1.1",
		"RPL-1.1",
		"RPL-1.5",
		"RPSL-1.0",
		"RSA-MD",
		"RSCPL",
		"Rdisc",
		"Ruby",
		"Ruby-pty",
		"SAX-PD",
		"SAX-PD-2.0",
		"SCEA",
		"SGI-B-1.0",
		"SGI-B-1.1",
		"SGI-B-2.0",
		"SGI-OpenGL",
		"SGP4",
		"SHL-0.5",
		"SHL-0.51",
		"SISSL",
		"SISSL-1.2",
		"SL",
		"SMAIL-GPL",
		"SMLNJ",
		"SMPPL",
		"SNIA",
		"SOFA",
		"SPL-1.0",
		"SSH-OpenSSH",
		"SSH-short",
		"SSLeay-standalone",
		"SSPL-1.0",
		"SUL-1.0",
		"SWL",
		"Saxpath",
		"SchemeReport",
		"Sendmail",
		"Sendmail-8.23",
		"Sendmail-Open-Source-1.1",
		"SimPL-2.0",
		"Sleepycat",
		"Soundex",
		"Spencer-86",
		"Spencer-94",
		"Spencer-99",
		"SugarCRM-1.1.3",
		"Sun-PPP",
		"Sun-PPP-2000",
		"SunPro",
		"Symlinks",
		"TAPR-OHL-1.0",
		"TCL",
		"TCP-wrappers",
		"TGPPL-1.0",
		"TMate",
		"TORQUE-1.1",
		"TOSL",
		"TPDL",
		"TPL-1.0",
		"TTWL",
		"TTYP0",
		"TU-Berlin-1.0",
		"TU-Berlin-2.0",
		"TermReadKey",
		"ThirdEye",
		"TrustedQSL",
		"UCAR",
		"UCL-1.0",
		"UMich-Merit",
		"UPL-1.0",
		"URT-RLE",
		"Ubuntu-font-1.0",
		"Unicode-3.0",
		"Unicode-DFS-2015",
		"Unicode-DFS-2016",
		"Unicode-TOU",
		"UnixCrypt",
		"Unlicense",
		"Unlicense-libtelnet",
		"Unlicense-libwhirlpool",
		"VOSTROM",
		"VSL-1.0",
		"Vim",
		"W3C",
		"W3C-19980720",
		"W3C-20150513",
		"WTFPL",
		"Watcom-1.0",
		"Widget-Workshop",
		"Wsuipa",
		"X11",
		"X11-distribute-modifications-variant",
		"X11-swapped",
		"XFree86-1.1",
		"XSkat",
		"Xdebug-1.03",
		"Xerox",
		"Xfig",
		"Xnet",
		"YPL-1.0",
		"YPL-1.1",
		"ZPL-1.1",
		"ZPL-2.0",
		"ZPL-2.1",
		"Zed",
		"Zeeff",
		"Zend-2.0",
		"Zimbra-1.3",
		"Zimbra-1.4",
		"Zlib",
		"any-OSI",
		"any-OSI-perl-modules",
		"bcrypt-Solar-Designer",
		"blessing",
		"bzip2-1.0.6",
		"check-cvs",
		"checkmk",
		"copyleft-next-0.3.0",
		"copyleft-next-0.3.1",
		"curl",
		"cve-tou",
		"diffmark",
		"dtoa",
		"dvipdfm",
		"eGenix",
		"etalab-2.0",
		"fwlw",
		"gSOAP-1.3b",
		"generic-xts",
		"gnuplot",
		"gtkbook",
		"hdparm",
		"iMatix",
		"jove",
		"libpng-1.6.35",
		"libpng-2.0",
		"libselinux-1.0",
		"libtiff",
		"libutil-David-Nugent",
		"lsof",
		"magaz",
		"mailprio",
		"man2html",
		"metamail",
		"mpi-permissive",
		"mpich2",
		"mplus",
		"ngrep",
		"pkgconf",
		"pnmstitch",
		"psfrag",
		"psutils",
		"python-ldap",
		"radvd",
		"snprintf",
		"softSurfer",
		"ssh-keyscan",
		"swrule",
		"threeparttable",
		"ulem",
		"w3m",
		"wwl",
		"xinetd",
		"xkeyboard-config-Zinoviev",
		"xlock",
		"xpp",
		"xzoom",
		"zlib-acknowledgement"
	];
}) });

//#endregion
//#region ../../../node_modules/.pnpm/spdx-license-ids@3.0.22/node_modules/spdx-license-ids/deprecated.json
var require_deprecated = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/spdx-license-ids@3.0.22/node_modules/spdx-license-ids/deprecated.json": ((exports, module) => {
	module.exports = [
		"AGPL-1.0",
		"AGPL-3.0",
		"BSD-2-Clause-FreeBSD",
		"BSD-2-Clause-NetBSD",
		"GFDL-1.1",
		"GFDL-1.2",
		"GFDL-1.3",
		"GPL-1.0",
		"GPL-2.0",
		"GPL-2.0-with-GCC-exception",
		"GPL-2.0-with-autoconf-exception",
		"GPL-2.0-with-bison-exception",
		"GPL-2.0-with-classpath-exception",
		"GPL-2.0-with-font-exception",
		"GPL-3.0",
		"GPL-3.0-with-GCC-exception",
		"GPL-3.0-with-autoconf-exception",
		"LGPL-2.0",
		"LGPL-2.1",
		"LGPL-3.0",
		"Net-SNMP",
		"Nunit",
		"StandardML-NJ",
		"bzip2-1.0.5",
		"eCos-2.0",
		"wxWindows"
	];
}) });

//#endregion
//#region ../../../node_modules/.pnpm/spdx-exceptions@2.5.0/node_modules/spdx-exceptions/index.json
var require_spdx_exceptions = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/spdx-exceptions@2.5.0/node_modules/spdx-exceptions/index.json": ((exports, module) => {
	module.exports = [
		"389-exception",
		"Asterisk-exception",
		"Autoconf-exception-2.0",
		"Autoconf-exception-3.0",
		"Autoconf-exception-generic",
		"Autoconf-exception-generic-3.0",
		"Autoconf-exception-macro",
		"Bison-exception-1.24",
		"Bison-exception-2.2",
		"Bootloader-exception",
		"Classpath-exception-2.0",
		"CLISP-exception-2.0",
		"cryptsetup-OpenSSL-exception",
		"DigiRule-FOSS-exception",
		"eCos-exception-2.0",
		"Fawkes-Runtime-exception",
		"FLTK-exception",
		"fmt-exception",
		"Font-exception-2.0",
		"freertos-exception-2.0",
		"GCC-exception-2.0",
		"GCC-exception-2.0-note",
		"GCC-exception-3.1",
		"Gmsh-exception",
		"GNAT-exception",
		"GNOME-examples-exception",
		"GNU-compiler-exception",
		"gnu-javamail-exception",
		"GPL-3.0-interface-exception",
		"GPL-3.0-linking-exception",
		"GPL-3.0-linking-source-exception",
		"GPL-CC-1.0",
		"GStreamer-exception-2005",
		"GStreamer-exception-2008",
		"i2p-gpl-java-exception",
		"KiCad-libraries-exception",
		"LGPL-3.0-linking-exception",
		"libpri-OpenH323-exception",
		"Libtool-exception",
		"Linux-syscall-note",
		"LLGPL",
		"LLVM-exception",
		"LZMA-exception",
		"mif-exception",
		"OCaml-LGPL-linking-exception",
		"OCCT-exception-1.0",
		"OpenJDK-assembly-exception-1.0",
		"openvpn-openssl-exception",
		"PS-or-PDF-font-exception-20170817",
		"QPL-1.0-INRIA-2004-exception",
		"Qt-GPL-exception-1.0",
		"Qt-LGPL-exception-1.1",
		"Qwt-exception-1.0",
		"SANE-exception",
		"SHL-2.0",
		"SHL-2.1",
		"stunnel-exception",
		"SWI-exception",
		"Swift-exception",
		"Texinfo-exception",
		"u-boot-exception-2.0",
		"UBDL-exception",
		"Universal-FOSS-exception-1.0",
		"vsftpd-openssl-exception",
		"WxWindows-exception-3.1",
		"x11vnc-openssl-exception"
	];
}) });

//#endregion
//#region ../../../node_modules/.pnpm/spdx-expression-parse@3.0.1/node_modules/spdx-expression-parse/scan.js
var require_scan = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/spdx-expression-parse@3.0.1/node_modules/spdx-expression-parse/scan.js": ((exports, module) => {
	var licenses = [].concat(require_spdx_license_ids()).concat(require_deprecated());
	var exceptions = require_spdx_exceptions();
	module.exports = function(source) {
		var index$1 = 0;
		function hasMore() {
			return index$1 < source.length;
		}
		function read(value) {
			if (value instanceof RegExp) {
				var chars = source.slice(index$1);
				var match = chars.match(value);
				if (match) {
					index$1 += match[0].length;
					return match[0];
				}
			} else if (source.indexOf(value, index$1) === index$1) {
				index$1 += value.length;
				return value;
			}
		}
		function skipWhitespace() {
			read(/[ ]*/);
		}
		function operator() {
			var string;
			var possibilities = [
				"WITH",
				"AND",
				"OR",
				"(",
				")",
				":",
				"+"
			];
			for (var i = 0; i < possibilities.length; i++) {
				string = read(possibilities[i]);
				if (string) break;
			}
			if (string === "+" && index$1 > 1 && source[index$1 - 2] === " ") throw new Error("Space before `+`");
			return string && {
				type: "OPERATOR",
				string
			};
		}
		function idstring() {
			return read(/[A-Za-z0-9-.]+/);
		}
		function expectIdstring() {
			var string = idstring();
			if (!string) throw new Error("Expected idstring at offset " + index$1);
			return string;
		}
		function documentRef() {
			if (read("DocumentRef-")) {
				var string = expectIdstring();
				return {
					type: "DOCUMENTREF",
					string
				};
			}
		}
		function licenseRef() {
			if (read("LicenseRef-")) {
				var string = expectIdstring();
				return {
					type: "LICENSEREF",
					string
				};
			}
		}
		function identifier() {
			var begin = index$1;
			var string = idstring();
			if (licenses.indexOf(string) !== -1) return {
				type: "LICENSE",
				string
			};
			else if (exceptions.indexOf(string) !== -1) return {
				type: "EXCEPTION",
				string
			};
			index$1 = begin;
		}
		function parseToken() {
			return operator() || documentRef() || licenseRef() || identifier();
		}
		var tokens = [];
		while (hasMore()) {
			skipWhitespace();
			if (!hasMore()) break;
			var token = parseToken();
			if (!token) throw new Error("Unexpected `" + source[index$1] + "` at offset " + index$1);
			tokens.push(token);
		}
		return tokens;
	};
}) });

//#endregion
//#region ../../../node_modules/.pnpm/spdx-expression-parse@3.0.1/node_modules/spdx-expression-parse/parse.js
var require_parse = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/spdx-expression-parse@3.0.1/node_modules/spdx-expression-parse/parse.js": ((exports, module) => {
	module.exports = function(tokens) {
		var index$1 = 0;
		function hasMore() {
			return index$1 < tokens.length;
		}
		function token() {
			return hasMore() ? tokens[index$1] : null;
		}
		function next() {
			if (!hasMore()) throw new Error();
			index$1++;
		}
		function parseOperator(operator) {
			var t$2 = token();
			if (t$2 && t$2.type === "OPERATOR" && operator === t$2.string) {
				next();
				return t$2.string;
			}
		}
		function parseWith() {
			if (parseOperator("WITH")) {
				var t$2 = token();
				if (t$2 && t$2.type === "EXCEPTION") {
					next();
					return t$2.string;
				}
				throw new Error("Expected exception after `WITH`");
			}
		}
		function parseLicenseRef() {
			var begin = index$1;
			var string = "";
			var t$2 = token();
			if (t$2.type === "DOCUMENTREF") {
				next();
				string += "DocumentRef-" + t$2.string + ":";
				if (!parseOperator(":")) throw new Error("Expected `:` after `DocumentRef-...`");
			}
			t$2 = token();
			if (t$2.type === "LICENSEREF") {
				next();
				string += "LicenseRef-" + t$2.string;
				return { license: string };
			}
			index$1 = begin;
		}
		function parseLicense() {
			var t$2 = token();
			if (t$2 && t$2.type === "LICENSE") {
				next();
				var node$1 = { license: t$2.string };
				if (parseOperator("+")) node$1.plus = true;
				var exception = parseWith();
				if (exception) node$1.exception = exception;
				return node$1;
			}
		}
		function parseParenthesizedExpression() {
			var left = parseOperator("(");
			if (!left) return;
			var expr = parseExpression();
			if (!parseOperator(")")) throw new Error("Expected `)`");
			return expr;
		}
		function parseAtom() {
			return parseParenthesizedExpression() || parseLicenseRef() || parseLicense();
		}
		function makeBinaryOpParser(operator, nextParser) {
			return function parseBinaryOp() {
				var left = nextParser();
				if (!left) return;
				if (!parseOperator(operator)) return left;
				var right = parseBinaryOp();
				if (!right) throw new Error("Expected expression");
				return {
					left,
					conjunction: operator.toLowerCase(),
					right
				};
			};
		}
		var parseAnd = makeBinaryOpParser("AND", parseAtom);
		var parseExpression = makeBinaryOpParser("OR", parseAnd);
		var node = parseExpression();
		if (!node || hasMore()) throw new Error("Syntax error");
		return node;
	};
}) });

//#endregion
//#region ../../../node_modules/.pnpm/spdx-expression-parse@3.0.1/node_modules/spdx-expression-parse/index.js
var require_spdx_expression_parse = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/spdx-expression-parse@3.0.1/node_modules/spdx-expression-parse/index.js": ((exports, module) => {
	var scan = require_scan();
	var parse$2 = require_parse();
	module.exports = function(source) {
		return parse$2(scan(source));
	};
}) });

//#endregion
//#region ../../../node_modules/.pnpm/spdx-correct@3.2.0/node_modules/spdx-correct/index.js
var require_spdx_correct = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/spdx-correct@3.2.0/node_modules/spdx-correct/index.js": ((exports, module) => {
	var parse$1 = require_spdx_expression_parse();
	var spdxLicenseIds = require_spdx_license_ids();
	function valid(string) {
		try {
			parse$1(string);
			return true;
		} catch (error) {
			return false;
		}
	}
	function sortTranspositions(a, b) {
		var length = b[0].length - a[0].length;
		if (length !== 0) return length;
		return a[0].toUpperCase().localeCompare(b[0].toUpperCase());
	}
	var transpositions = [
		["APGL", "AGPL"],
		["Gpl", "GPL"],
		["GLP", "GPL"],
		["APL", "Apache"],
		["ISD", "ISC"],
		["GLP", "GPL"],
		["IST", "ISC"],
		["Claude", "Clause"],
		[" or later", "+"],
		[" International", ""],
		["GNU", "GPL"],
		["GUN", "GPL"],
		["+", ""],
		["GNU GPL", "GPL"],
		["GNU LGPL", "LGPL"],
		["GNU/GPL", "GPL"],
		["GNU GLP", "GPL"],
		["GNU LESSER GENERAL PUBLIC LICENSE", "LGPL"],
		["GNU Lesser General Public License", "LGPL"],
		["GNU LESSER GENERAL PUBLIC LICENSE", "LGPL-2.1"],
		["GNU Lesser General Public License", "LGPL-2.1"],
		["LESSER GENERAL PUBLIC LICENSE", "LGPL"],
		["Lesser General Public License", "LGPL"],
		["LESSER GENERAL PUBLIC LICENSE", "LGPL-2.1"],
		["Lesser General Public License", "LGPL-2.1"],
		["GNU General Public License", "GPL"],
		["Gnu public license", "GPL"],
		["GNU Public License", "GPL"],
		["GNU GENERAL PUBLIC LICENSE", "GPL"],
		["MTI", "MIT"],
		["Mozilla Public License", "MPL"],
		["Universal Permissive License", "UPL"],
		["WTH", "WTF"],
		["WTFGPL", "WTFPL"],
		["-License", ""]
	].sort(sortTranspositions);
	var TRANSPOSED = 0;
	var CORRECT = 1;
	var transforms = [
		function(argument) {
			return argument.toUpperCase();
		},
		function(argument) {
			return argument.trim();
		},
		function(argument) {
			return argument.replace(/\./g, "");
		},
		function(argument) {
			return argument.replace(/\s+/g, "");
		},
		function(argument) {
			return argument.replace(/\s+/g, "-");
		},
		function(argument) {
			return argument.replace("v", "-");
		},
		function(argument) {
			return argument.replace(/,?\s*(\d)/, "-$1");
		},
		function(argument) {
			return argument.replace(/,?\s*(\d)/, "-$1.0");
		},
		function(argument) {
			return argument.replace(/,?\s*(V\.|v\.|V|v|Version|version)\s*(\d)/, "-$2");
		},
		function(argument) {
			return argument.replace(/,?\s*(V\.|v\.|V|v|Version|version)\s*(\d)/, "-$2.0");
		},
		function(argument) {
			return argument[0].toUpperCase() + argument.slice(1);
		},
		function(argument) {
			return argument.replace("/", "-");
		},
		function(argument) {
			return argument.replace(/\s*V\s*(\d)/, "-$1").replace(/(\d)$/, "$1.0");
		},
		function(argument) {
			if (argument.indexOf("3.0") !== -1) return argument + "-or-later";
			else return argument + "-only";
		},
		function(argument) {
			return argument + "only";
		},
		function(argument) {
			return argument.replace(/(\d)$/, "-$1.0");
		},
		function(argument) {
			return argument.replace(/(-| )?(\d)$/, "-$2-Clause");
		},
		function(argument) {
			return argument.replace(/(-| )clause(-| )(\d)/, "-$3-Clause");
		},
		function(argument) {
			return argument.replace(/\b(Modified|New|Revised)(-| )?BSD((-| )License)?/i, "BSD-3-Clause");
		},
		function(argument) {
			return argument.replace(/\bSimplified(-| )?BSD((-| )License)?/i, "BSD-2-Clause");
		},
		function(argument) {
			return argument.replace(/\b(Free|Net)(-| )?BSD((-| )License)?/i, "BSD-2-Clause-$1BSD");
		},
		function(argument) {
			return argument.replace(/\bClear(-| )?BSD((-| )License)?/i, "BSD-3-Clause-Clear");
		},
		function(argument) {
			return argument.replace(/\b(Old|Original)(-| )?BSD((-| )License)?/i, "BSD-4-Clause");
		},
		function(argument) {
			return "CC-" + argument;
		},
		function(argument) {
			return "CC-" + argument + "-4.0";
		},
		function(argument) {
			return argument.replace("Attribution", "BY").replace("NonCommercial", "NC").replace("NoDerivatives", "ND").replace(/ (\d)/, "-$1").replace(/ ?International/, "");
		},
		function(argument) {
			return "CC-" + argument.replace("Attribution", "BY").replace("NonCommercial", "NC").replace("NoDerivatives", "ND").replace(/ (\d)/, "-$1").replace(/ ?International/, "") + "-4.0";
		}
	];
	var licensesWithVersions = spdxLicenseIds.map(function(id) {
		var match = /^(.*)-\d+\.\d+$/.exec(id);
		return match ? [match[0], match[1]] : [id, null];
	}).reduce(function(objectMap, item) {
		var key = item[1];
		objectMap[key] = objectMap[key] || [];
		objectMap[key].push(item[0]);
		return objectMap;
	}, {});
	var licensesWithOneVersion = Object.keys(licensesWithVersions).map(function makeEntries(key) {
		return [key, licensesWithVersions[key]];
	}).filter(function identifySoleVersions(item) {
		return item[1].length === 1 && item[0] !== null && item[0] !== "APL";
	}).map(function createLastResorts(item) {
		return [item[0], item[1][0]];
	});
	licensesWithVersions = void 0;
	var lastResorts = [
		["UNLI", "Unlicense"],
		["WTF", "WTFPL"],
		["2 CLAUSE", "BSD-2-Clause"],
		["2-CLAUSE", "BSD-2-Clause"],
		["3 CLAUSE", "BSD-3-Clause"],
		["3-CLAUSE", "BSD-3-Clause"],
		["AFFERO", "AGPL-3.0-or-later"],
		["AGPL", "AGPL-3.0-or-later"],
		["APACHE", "Apache-2.0"],
		["ARTISTIC", "Artistic-2.0"],
		["Affero", "AGPL-3.0-or-later"],
		["BEER", "Beerware"],
		["BOOST", "BSL-1.0"],
		["BSD", "BSD-2-Clause"],
		["CDDL", "CDDL-1.1"],
		["ECLIPSE", "EPL-1.0"],
		["FUCK", "WTFPL"],
		["GNU", "GPL-3.0-or-later"],
		["LGPL", "LGPL-3.0-or-later"],
		["GPLV1", "GPL-1.0-only"],
		["GPL-1", "GPL-1.0-only"],
		["GPLV2", "GPL-2.0-only"],
		["GPL-2", "GPL-2.0-only"],
		["GPL", "GPL-3.0-or-later"],
		["MIT +NO-FALSE-ATTRIBS", "MITNFA"],
		["MIT", "MIT"],
		["MPL", "MPL-2.0"],
		["X11", "X11"],
		["ZLIB", "Zlib"]
	].concat(licensesWithOneVersion).sort(sortTranspositions);
	var SUBSTRING = 0;
	var IDENTIFIER = 1;
	var validTransformation = function(identifier) {
		for (var i = 0; i < transforms.length; i++) {
			var transformed = transforms[i](identifier).trim();
			if (transformed !== identifier && valid(transformed)) return transformed;
		}
		return null;
	};
	var validLastResort = function(identifier) {
		var upperCased = identifier.toUpperCase();
		for (var i = 0; i < lastResorts.length; i++) {
			var lastResort = lastResorts[i];
			if (upperCased.indexOf(lastResort[SUBSTRING]) > -1) return lastResort[IDENTIFIER];
		}
		return null;
	};
	var anyCorrection = function(identifier, check) {
		for (var i = 0; i < transpositions.length; i++) {
			var transposition = transpositions[i];
			var transposed = transposition[TRANSPOSED];
			if (identifier.indexOf(transposed) > -1) {
				var corrected = identifier.replace(transposed, transposition[CORRECT]);
				var checked = check(corrected);
				if (checked !== null) return checked;
			}
		}
		return null;
	};
	module.exports = function(identifier, options) {
		options = options || {};
		var upgrade = options.upgrade === void 0 ? true : !!options.upgrade;
		function postprocess(value) {
			return upgrade ? upgradeGPLs(value) : value;
		}
		var validArugment = typeof identifier === "string" && identifier.trim().length !== 0;
		if (!validArugment) throw Error("Invalid argument. Expected non-empty string.");
		identifier = identifier.trim();
		if (valid(identifier)) return postprocess(identifier);
		var noPlus = identifier.replace(/\+$/, "").trim();
		if (valid(noPlus)) return postprocess(noPlus);
		var transformed = validTransformation(identifier);
		if (transformed !== null) return postprocess(transformed);
		transformed = anyCorrection(identifier, function(argument) {
			if (valid(argument)) return argument;
			return validTransformation(argument);
		});
		if (transformed !== null) return postprocess(transformed);
		transformed = validLastResort(identifier);
		if (transformed !== null) return postprocess(transformed);
		transformed = anyCorrection(identifier, validLastResort);
		if (transformed !== null) return postprocess(transformed);
		return null;
	};
	function upgradeGPLs(value) {
		if ([
			"GPL-1.0",
			"LGPL-1.0",
			"AGPL-1.0",
			"GPL-2.0",
			"LGPL-2.0",
			"AGPL-2.0",
			"LGPL-2.1"
		].indexOf(value) !== -1) return value + "-only";
		else if ([
			"GPL-1.0+",
			"GPL-2.0+",
			"GPL-3.0+",
			"LGPL-2.0+",
			"LGPL-2.1+",
			"LGPL-3.0+",
			"AGPL-1.0+",
			"AGPL-3.0+"
		].indexOf(value) !== -1) return value.replace(/\+$/, "-or-later");
		else if ([
			"GPL-3.0",
			"LGPL-3.0",
			"AGPL-3.0"
		].indexOf(value) !== -1) return value + "-or-later";
		else return value;
	}
}) });

//#endregion
//#region ../../../node_modules/.pnpm/validate-npm-package-license@3.0.4/node_modules/validate-npm-package-license/index.js
var require_validate_npm_package_license = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/validate-npm-package-license@3.0.4/node_modules/validate-npm-package-license/index.js": ((exports, module) => {
	var parse = require_spdx_expression_parse();
	var correct = require_spdx_correct();
	var genericWarning = "license should be a valid SPDX license expression (without \"LicenseRef\"), \"UNLICENSED\", or \"SEE LICENSE IN <filename>\"";
	var fileReferenceRE = /^SEE LICEN[CS]E IN (.+)$/;
	function startsWith(prefix, string) {
		return string.slice(0, prefix.length) === prefix;
	}
	function usesLicenseRef(ast) {
		if (ast.hasOwnProperty("license")) {
			var license = ast.license;
			return startsWith("LicenseRef", license) || startsWith("DocumentRef", license);
		} else return usesLicenseRef(ast.left) || usesLicenseRef(ast.right);
	}
	module.exports = function(argument) {
		var ast;
		try {
			ast = parse(argument);
		} catch (e) {
			var match;
			if (argument === "UNLICENSED" || argument === "UNLICENCED") return {
				validForOldPackages: true,
				validForNewPackages: true,
				unlicensed: true
			};
			else if (match = fileReferenceRE.exec(argument)) return {
				validForOldPackages: true,
				validForNewPackages: true,
				inFile: match[1]
			};
			else {
				var result = {
					validForOldPackages: false,
					validForNewPackages: false,
					warnings: [genericWarning]
				};
				if (argument.trim().length !== 0) {
					var corrected = correct(argument);
					if (corrected) result.warnings.push("license is similar to the valid expression \"" + corrected + "\"");
				}
				return result;
			}
		}
		if (usesLicenseRef(ast)) return {
			validForNewPackages: false,
			validForOldPackages: false,
			spdx: true,
			warnings: [genericWarning]
		};
		else return {
			validForNewPackages: true,
			validForOldPackages: true,
			spdx: true
		};
	};
}) });

//#endregion
//#region ../../../node_modules/.pnpm/lru-cache@10.4.3/node_modules/lru-cache/dist/commonjs/index.js
var require_commonjs = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/lru-cache@10.4.3/node_modules/lru-cache/dist/commonjs/index.js": ((exports) => {
	/**
	* @module LRUCache
	*/
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.LRUCache = void 0;
	const perf = typeof performance === "object" && performance && typeof performance.now === "function" ? performance : Date;
	const warned = /* @__PURE__ */ new Set();
	/* c8 ignore start */
	const PROCESS = typeof process === "object" && !!process ? process : {};
	/* c8 ignore start */
	const emitWarning = (msg, type, code, fn) => {
		typeof PROCESS.emitWarning === "function" ? PROCESS.emitWarning(msg, type, code, fn) : console.error(`[${code}] ${type}: ${msg}`);
	};
	let AC = globalThis.AbortController;
	let AS = globalThis.AbortSignal;
	/* c8 ignore start */
	if (typeof AC === "undefined") {
		AS = class AbortSignal {
			onabort;
			_onabort = [];
			reason;
			aborted = false;
			addEventListener(_, fn) {
				this._onabort.push(fn);
			}
		};
		AC = class AbortController {
			constructor() {
				warnACPolyfill();
			}
			signal = new AS();
			abort(reason) {
				if (this.signal.aborted) return;
				this.signal.reason = reason;
				this.signal.aborted = true;
				for (const fn of this.signal._onabort) fn(reason);
				this.signal.onabort?.(reason);
			}
		};
		let printACPolyfillWarning = PROCESS.env?.LRU_CACHE_IGNORE_AC_WARNING !== "1";
		const warnACPolyfill = () => {
			if (!printACPolyfillWarning) return;
			printACPolyfillWarning = false;
			emitWarning("AbortController is not defined. If using lru-cache in node 14, load an AbortController polyfill from the `node-abort-controller` package. A minimal polyfill is provided for use by LRUCache.fetch(), but it should not be relied upon in other contexts (eg, passing it to other APIs that use AbortController/AbortSignal might have undesirable effects). You may disable this with LRU_CACHE_IGNORE_AC_WARNING=1 in the env.", "NO_ABORT_CONTROLLER", "ENOTSUP", warnACPolyfill);
		};
	}
	/* c8 ignore stop */
	const shouldWarn = (code) => !warned.has(code);
	Symbol("type");
	const isPosInt = (n) => n && n === Math.floor(n) && n > 0 && isFinite(n);
	/* c8 ignore start */
	const getUintArray = (max) => !isPosInt(max) ? null : max <= Math.pow(2, 8) ? Uint8Array : max <= Math.pow(2, 16) ? Uint16Array : max <= Math.pow(2, 32) ? Uint32Array : max <= Number.MAX_SAFE_INTEGER ? ZeroArray : null;
	/* c8 ignore stop */
	var ZeroArray = class extends Array {
		constructor(size) {
			super(size);
			this.fill(0);
		}
	};
	var Stack = class Stack {
		heap;
		length;
		static #constructing = false;
		static create(max) {
			const HeapCls = getUintArray(max);
			if (!HeapCls) return [];
			Stack.#constructing = true;
			const s = new Stack(max, HeapCls);
			Stack.#constructing = false;
			return s;
		}
		constructor(max, HeapCls) {
			/* c8 ignore start */
			if (!Stack.#constructing) throw new TypeError("instantiate Stack using Stack.create(n)");
			/* c8 ignore stop */
			this.heap = new HeapCls(max);
			this.length = 0;
		}
		push(n) {
			this.heap[this.length++] = n;
		}
		pop() {
			return this.heap[--this.length];
		}
	};
	/**
	* Default export, the thing you're using this module to get.
	*
	* The `K` and `V` types define the key and value types, respectively. The
	* optional `FC` type defines the type of the `context` object passed to
	* `cache.fetch()` and `cache.memo()`.
	*
	* Keys and values **must not** be `null` or `undefined`.
	*
	* All properties from the options object (with the exception of `max`,
	* `maxSize`, `fetchMethod`, `memoMethod`, `dispose` and `disposeAfter`) are
	* added as normal public members. (The listed options are read-only getters.)
	*
	* Changing any of these will alter the defaults for subsequent method calls.
	*/
	var LRUCache$1 = class LRUCache$1 {
		#max;
		#maxSize;
		#dispose;
		#disposeAfter;
		#fetchMethod;
		#memoMethod;
		/**
		* {@link LRUCache.OptionsBase.ttl}
		*/
		ttl;
		/**
		* {@link LRUCache.OptionsBase.ttlResolution}
		*/
		ttlResolution;
		/**
		* {@link LRUCache.OptionsBase.ttlAutopurge}
		*/
		ttlAutopurge;
		/**
		* {@link LRUCache.OptionsBase.updateAgeOnGet}
		*/
		updateAgeOnGet;
		/**
		* {@link LRUCache.OptionsBase.updateAgeOnHas}
		*/
		updateAgeOnHas;
		/**
		* {@link LRUCache.OptionsBase.allowStale}
		*/
		allowStale;
		/**
		* {@link LRUCache.OptionsBase.noDisposeOnSet}
		*/
		noDisposeOnSet;
		/**
		* {@link LRUCache.OptionsBase.noUpdateTTL}
		*/
		noUpdateTTL;
		/**
		* {@link LRUCache.OptionsBase.maxEntrySize}
		*/
		maxEntrySize;
		/**
		* {@link LRUCache.OptionsBase.sizeCalculation}
		*/
		sizeCalculation;
		/**
		* {@link LRUCache.OptionsBase.noDeleteOnFetchRejection}
		*/
		noDeleteOnFetchRejection;
		/**
		* {@link LRUCache.OptionsBase.noDeleteOnStaleGet}
		*/
		noDeleteOnStaleGet;
		/**
		* {@link LRUCache.OptionsBase.allowStaleOnFetchAbort}
		*/
		allowStaleOnFetchAbort;
		/**
		* {@link LRUCache.OptionsBase.allowStaleOnFetchRejection}
		*/
		allowStaleOnFetchRejection;
		/**
		* {@link LRUCache.OptionsBase.ignoreFetchAbort}
		*/
		ignoreFetchAbort;
		#size;
		#calculatedSize;
		#keyMap;
		#keyList;
		#valList;
		#next;
		#prev;
		#head;
		#tail;
		#free;
		#disposed;
		#sizes;
		#starts;
		#ttls;
		#hasDispose;
		#hasFetchMethod;
		#hasDisposeAfter;
		/**
		* Do not call this method unless you need to inspect the
		* inner workings of the cache.  If anything returned by this
		* object is modified in any way, strange breakage may occur.
		*
		* These fields are private for a reason!
		*
		* @internal
		*/
		static unsafeExposeInternals(c) {
			return {
				starts: c.#starts,
				ttls: c.#ttls,
				sizes: c.#sizes,
				keyMap: c.#keyMap,
				keyList: c.#keyList,
				valList: c.#valList,
				next: c.#next,
				prev: c.#prev,
				get head() {
					return c.#head;
				},
				get tail() {
					return c.#tail;
				},
				free: c.#free,
				isBackgroundFetch: (p$1) => c.#isBackgroundFetch(p$1),
				backgroundFetch: (k, index$1, options, context) => c.#backgroundFetch(k, index$1, options, context),
				moveToTail: (index$1) => c.#moveToTail(index$1),
				indexes: (options) => c.#indexes(options),
				rindexes: (options) => c.#rindexes(options),
				isStale: (index$1) => c.#isStale(index$1)
			};
		}
		/**
		* {@link LRUCache.OptionsBase.max} (read-only)
		*/
		get max() {
			return this.#max;
		}
		/**
		* {@link LRUCache.OptionsBase.maxSize} (read-only)
		*/
		get maxSize() {
			return this.#maxSize;
		}
		/**
		* The total computed size of items in the cache (read-only)
		*/
		get calculatedSize() {
			return this.#calculatedSize;
		}
		/**
		* The number of items stored in the cache (read-only)
		*/
		get size() {
			return this.#size;
		}
		/**
		* {@link LRUCache.OptionsBase.fetchMethod} (read-only)
		*/
		get fetchMethod() {
			return this.#fetchMethod;
		}
		get memoMethod() {
			return this.#memoMethod;
		}
		/**
		* {@link LRUCache.OptionsBase.dispose} (read-only)
		*/
		get dispose() {
			return this.#dispose;
		}
		/**
		* {@link LRUCache.OptionsBase.disposeAfter} (read-only)
		*/
		get disposeAfter() {
			return this.#disposeAfter;
		}
		constructor(options) {
			const { max = 0, ttl, ttlResolution = 1, ttlAutopurge, updateAgeOnGet, updateAgeOnHas, allowStale, dispose, disposeAfter, noDisposeOnSet, noUpdateTTL, maxSize = 0, maxEntrySize = 0, sizeCalculation, fetchMethod, memoMethod, noDeleteOnFetchRejection, noDeleteOnStaleGet, allowStaleOnFetchRejection, allowStaleOnFetchAbort, ignoreFetchAbort } = options;
			if (max !== 0 && !isPosInt(max)) throw new TypeError("max option must be a nonnegative integer");
			const UintArray = max ? getUintArray(max) : Array;
			if (!UintArray) throw new Error("invalid max value: " + max);
			this.#max = max;
			this.#maxSize = maxSize;
			this.maxEntrySize = maxEntrySize || this.#maxSize;
			this.sizeCalculation = sizeCalculation;
			if (this.sizeCalculation) {
				if (!this.#maxSize && !this.maxEntrySize) throw new TypeError("cannot set sizeCalculation without setting maxSize or maxEntrySize");
				if (typeof this.sizeCalculation !== "function") throw new TypeError("sizeCalculation set to non-function");
			}
			if (memoMethod !== void 0 && typeof memoMethod !== "function") throw new TypeError("memoMethod must be a function if defined");
			this.#memoMethod = memoMethod;
			if (fetchMethod !== void 0 && typeof fetchMethod !== "function") throw new TypeError("fetchMethod must be a function if specified");
			this.#fetchMethod = fetchMethod;
			this.#hasFetchMethod = !!fetchMethod;
			this.#keyMap = /* @__PURE__ */ new Map();
			this.#keyList = new Array(max).fill(void 0);
			this.#valList = new Array(max).fill(void 0);
			this.#next = new UintArray(max);
			this.#prev = new UintArray(max);
			this.#head = 0;
			this.#tail = 0;
			this.#free = Stack.create(max);
			this.#size = 0;
			this.#calculatedSize = 0;
			if (typeof dispose === "function") this.#dispose = dispose;
			if (typeof disposeAfter === "function") {
				this.#disposeAfter = disposeAfter;
				this.#disposed = [];
			} else {
				this.#disposeAfter = void 0;
				this.#disposed = void 0;
			}
			this.#hasDispose = !!this.#dispose;
			this.#hasDisposeAfter = !!this.#disposeAfter;
			this.noDisposeOnSet = !!noDisposeOnSet;
			this.noUpdateTTL = !!noUpdateTTL;
			this.noDeleteOnFetchRejection = !!noDeleteOnFetchRejection;
			this.allowStaleOnFetchRejection = !!allowStaleOnFetchRejection;
			this.allowStaleOnFetchAbort = !!allowStaleOnFetchAbort;
			this.ignoreFetchAbort = !!ignoreFetchAbort;
			if (this.maxEntrySize !== 0) {
				if (this.#maxSize !== 0) {
					if (!isPosInt(this.#maxSize)) throw new TypeError("maxSize must be a positive integer if specified");
				}
				if (!isPosInt(this.maxEntrySize)) throw new TypeError("maxEntrySize must be a positive integer if specified");
				this.#initializeSizeTracking();
			}
			this.allowStale = !!allowStale;
			this.noDeleteOnStaleGet = !!noDeleteOnStaleGet;
			this.updateAgeOnGet = !!updateAgeOnGet;
			this.updateAgeOnHas = !!updateAgeOnHas;
			this.ttlResolution = isPosInt(ttlResolution) || ttlResolution === 0 ? ttlResolution : 1;
			this.ttlAutopurge = !!ttlAutopurge;
			this.ttl = ttl || 0;
			if (this.ttl) {
				if (!isPosInt(this.ttl)) throw new TypeError("ttl must be a positive integer if specified");
				this.#initializeTTLTracking();
			}
			if (this.#max === 0 && this.ttl === 0 && this.#maxSize === 0) throw new TypeError("At least one of max, maxSize, or ttl is required");
			if (!this.ttlAutopurge && !this.#max && !this.#maxSize) {
				const code = "LRU_CACHE_UNBOUNDED";
				if (shouldWarn(code)) {
					warned.add(code);
					const msg = "TTL caching without ttlAutopurge, max, or maxSize can result in unbounded memory consumption.";
					emitWarning(msg, "UnboundedCacheWarning", code, LRUCache$1);
				}
			}
		}
		/**
		* Return the number of ms left in the item's TTL. If item is not in cache,
		* returns `0`. Returns `Infinity` if item is in cache without a defined TTL.
		*/
		getRemainingTTL(key) {
			return this.#keyMap.has(key) ? Infinity : 0;
		}
		#initializeTTLTracking() {
			const ttls = new ZeroArray(this.#max);
			const starts = new ZeroArray(this.#max);
			this.#ttls = ttls;
			this.#starts = starts;
			this.#setItemTTL = (index$1, ttl, start = perf.now()) => {
				starts[index$1] = ttl !== 0 ? start : 0;
				ttls[index$1] = ttl;
				if (ttl !== 0 && this.ttlAutopurge) {
					const t$2 = setTimeout(() => {
						if (this.#isStale(index$1)) this.#delete(this.#keyList[index$1], "expire");
					}, ttl + 1);
					/* c8 ignore start */
					if (t$2.unref) t$2.unref();
				}
			};
			this.#updateItemAge = (index$1) => {
				starts[index$1] = ttls[index$1] !== 0 ? perf.now() : 0;
			};
			this.#statusTTL = (status, index$1) => {
				if (ttls[index$1]) {
					const ttl = ttls[index$1];
					const start = starts[index$1];
					/* c8 ignore next */
					if (!ttl || !start) return;
					status.ttl = ttl;
					status.start = start;
					status.now = cachedNow || getNow();
					const age = status.now - start;
					status.remainingTTL = ttl - age;
				}
			};
			let cachedNow = 0;
			const getNow = () => {
				const n = perf.now();
				if (this.ttlResolution > 0) {
					cachedNow = n;
					const t$2 = setTimeout(() => cachedNow = 0, this.ttlResolution);
					/* c8 ignore start */
					if (t$2.unref) t$2.unref();
				}
				return n;
			};
			this.getRemainingTTL = (key) => {
				const index$1 = this.#keyMap.get(key);
				if (index$1 === void 0) return 0;
				const ttl = ttls[index$1];
				const start = starts[index$1];
				if (!ttl || !start) return Infinity;
				const age = (cachedNow || getNow()) - start;
				return ttl - age;
			};
			this.#isStale = (index$1) => {
				const s = starts[index$1];
				const t$2 = ttls[index$1];
				return !!t$2 && !!s && (cachedNow || getNow()) - s > t$2;
			};
		}
		#updateItemAge = () => {};
		#statusTTL = () => {};
		#setItemTTL = () => {};
		/* c8 ignore stop */
		#isStale = () => false;
		#initializeSizeTracking() {
			const sizes = new ZeroArray(this.#max);
			this.#calculatedSize = 0;
			this.#sizes = sizes;
			this.#removeItemSize = (index$1) => {
				this.#calculatedSize -= sizes[index$1];
				sizes[index$1] = 0;
			};
			this.#requireSize = (k, v, size, sizeCalculation) => {
				if (this.#isBackgroundFetch(v)) return 0;
				if (!isPosInt(size)) if (sizeCalculation) {
					if (typeof sizeCalculation !== "function") throw new TypeError("sizeCalculation must be a function");
					size = sizeCalculation(v, k);
					if (!isPosInt(size)) throw new TypeError("sizeCalculation return invalid (expect positive integer)");
				} else throw new TypeError("invalid size value (must be positive integer). When maxSize or maxEntrySize is used, sizeCalculation or size must be set.");
				return size;
			};
			this.#addItemSize = (index$1, size, status) => {
				sizes[index$1] = size;
				if (this.#maxSize) {
					const maxSize = this.#maxSize - sizes[index$1];
					while (this.#calculatedSize > maxSize) this.#evict(true);
				}
				this.#calculatedSize += sizes[index$1];
				if (status) {
					status.entrySize = size;
					status.totalCalculatedSize = this.#calculatedSize;
				}
			};
		}
		#removeItemSize = (_i) => {};
		#addItemSize = (_i, _s, _st) => {};
		#requireSize = (_k, _v, size, sizeCalculation) => {
			if (size || sizeCalculation) throw new TypeError("cannot set size without setting maxSize or maxEntrySize on cache");
			return 0;
		};
		*#indexes({ allowStale = this.allowStale } = {}) {
			if (this.#size) for (let i = this.#tail;;) {
				if (!this.#isValidIndex(i)) break;
				if (allowStale || !this.#isStale(i)) yield i;
				if (i === this.#head) break;
				else i = this.#prev[i];
			}
		}
		*#rindexes({ allowStale = this.allowStale } = {}) {
			if (this.#size) for (let i = this.#head;;) {
				if (!this.#isValidIndex(i)) break;
				if (allowStale || !this.#isStale(i)) yield i;
				if (i === this.#tail) break;
				else i = this.#next[i];
			}
		}
		#isValidIndex(index$1) {
			return index$1 !== void 0 && this.#keyMap.get(this.#keyList[index$1]) === index$1;
		}
		/**
		* Return a generator yielding `[key, value]` pairs,
		* in order from most recently used to least recently used.
		*/
		*entries() {
			for (const i of this.#indexes()) if (this.#valList[i] !== void 0 && this.#keyList[i] !== void 0 && !this.#isBackgroundFetch(this.#valList[i])) yield [this.#keyList[i], this.#valList[i]];
		}
		/**
		* Inverse order version of {@link LRUCache.entries}
		*
		* Return a generator yielding `[key, value]` pairs,
		* in order from least recently used to most recently used.
		*/
		*rentries() {
			for (const i of this.#rindexes()) if (this.#valList[i] !== void 0 && this.#keyList[i] !== void 0 && !this.#isBackgroundFetch(this.#valList[i])) yield [this.#keyList[i], this.#valList[i]];
		}
		/**
		* Return a generator yielding the keys in the cache,
		* in order from most recently used to least recently used.
		*/
		*keys() {
			for (const i of this.#indexes()) {
				const k = this.#keyList[i];
				if (k !== void 0 && !this.#isBackgroundFetch(this.#valList[i])) yield k;
			}
		}
		/**
		* Inverse order version of {@link LRUCache.keys}
		*
		* Return a generator yielding the keys in the cache,
		* in order from least recently used to most recently used.
		*/
		*rkeys() {
			for (const i of this.#rindexes()) {
				const k = this.#keyList[i];
				if (k !== void 0 && !this.#isBackgroundFetch(this.#valList[i])) yield k;
			}
		}
		/**
		* Return a generator yielding the values in the cache,
		* in order from most recently used to least recently used.
		*/
		*values() {
			for (const i of this.#indexes()) {
				const v = this.#valList[i];
				if (v !== void 0 && !this.#isBackgroundFetch(this.#valList[i])) yield this.#valList[i];
			}
		}
		/**
		* Inverse order version of {@link LRUCache.values}
		*
		* Return a generator yielding the values in the cache,
		* in order from least recently used to most recently used.
		*/
		*rvalues() {
			for (const i of this.#rindexes()) {
				const v = this.#valList[i];
				if (v !== void 0 && !this.#isBackgroundFetch(this.#valList[i])) yield this.#valList[i];
			}
		}
		/**
		* Iterating over the cache itself yields the same results as
		* {@link LRUCache.entries}
		*/
		[Symbol.iterator]() {
			return this.entries();
		}
		/**
		* A String value that is used in the creation of the default string
		* description of an object. Called by the built-in method
		* `Object.prototype.toString`.
		*/
		[Symbol.toStringTag] = "LRUCache";
		/**
		* Find a value for which the supplied fn method returns a truthy value,
		* similar to `Array.find()`. fn is called as `fn(value, key, cache)`.
		*/
		find(fn, getOptions = {}) {
			for (const i of this.#indexes()) {
				const v = this.#valList[i];
				const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
				if (value === void 0) continue;
				if (fn(value, this.#keyList[i], this)) return this.get(this.#keyList[i], getOptions);
			}
		}
		/**
		* Call the supplied function on each item in the cache, in order from most
		* recently used to least recently used.
		*
		* `fn` is called as `fn(value, key, cache)`.
		*
		* If `thisp` is provided, function will be called in the `this`-context of
		* the provided object, or the cache if no `thisp` object is provided.
		*
		* Does not update age or recenty of use, or iterate over stale values.
		*/
		forEach(fn, thisp = this) {
			for (const i of this.#indexes()) {
				const v = this.#valList[i];
				const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
				if (value === void 0) continue;
				fn.call(thisp, value, this.#keyList[i], this);
			}
		}
		/**
		* The same as {@link LRUCache.forEach} but items are iterated over in
		* reverse order.  (ie, less recently used items are iterated over first.)
		*/
		rforEach(fn, thisp = this) {
			for (const i of this.#rindexes()) {
				const v = this.#valList[i];
				const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
				if (value === void 0) continue;
				fn.call(thisp, value, this.#keyList[i], this);
			}
		}
		/**
		* Delete any stale entries. Returns true if anything was removed,
		* false otherwise.
		*/
		purgeStale() {
			let deleted = false;
			for (const i of this.#rindexes({ allowStale: true })) if (this.#isStale(i)) {
				this.#delete(this.#keyList[i], "expire");
				deleted = true;
			}
			return deleted;
		}
		/**
		* Get the extended info about a given entry, to get its value, size, and
		* TTL info simultaneously. Returns `undefined` if the key is not present.
		*
		* Unlike {@link LRUCache#dump}, which is designed to be portable and survive
		* serialization, the `start` value is always the current timestamp, and the
		* `ttl` is a calculated remaining time to live (negative if expired).
		*
		* Always returns stale values, if their info is found in the cache, so be
		* sure to check for expirations (ie, a negative {@link LRUCache.Entry#ttl})
		* if relevant.
		*/
		info(key) {
			const i = this.#keyMap.get(key);
			if (i === void 0) return void 0;
			const v = this.#valList[i];
			const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
			if (value === void 0) return void 0;
			const entry = { value };
			if (this.#ttls && this.#starts) {
				const ttl = this.#ttls[i];
				const start = this.#starts[i];
				if (ttl && start) {
					const remain = ttl - (perf.now() - start);
					entry.ttl = remain;
					entry.start = Date.now();
				}
			}
			if (this.#sizes) entry.size = this.#sizes[i];
			return entry;
		}
		/**
		* Return an array of [key, {@link LRUCache.Entry}] tuples which can be
		* passed to {@link LRLUCache#load}.
		*
		* The `start` fields are calculated relative to a portable `Date.now()`
		* timestamp, even if `performance.now()` is available.
		*
		* Stale entries are always included in the `dump`, even if
		* {@link LRUCache.OptionsBase.allowStale} is false.
		*
		* Note: this returns an actual array, not a generator, so it can be more
		* easily passed around.
		*/
		dump() {
			const arr = [];
			for (const i of this.#indexes({ allowStale: true })) {
				const key = this.#keyList[i];
				const v = this.#valList[i];
				const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
				if (value === void 0 || key === void 0) continue;
				const entry = { value };
				if (this.#ttls && this.#starts) {
					entry.ttl = this.#ttls[i];
					const age = perf.now() - this.#starts[i];
					entry.start = Math.floor(Date.now() - age);
				}
				if (this.#sizes) entry.size = this.#sizes[i];
				arr.unshift([key, entry]);
			}
			return arr;
		}
		/**
		* Reset the cache and load in the items in entries in the order listed.
		*
		* The shape of the resulting cache may be different if the same options are
		* not used in both caches.
		*
		* The `start` fields are assumed to be calculated relative to a portable
		* `Date.now()` timestamp, even if `performance.now()` is available.
		*/
		load(arr) {
			this.clear();
			for (const [key, entry] of arr) {
				if (entry.start) {
					const age = Date.now() - entry.start;
					entry.start = perf.now() - age;
				}
				this.set(key, entry.value, entry);
			}
		}
		/**
		* Add a value to the cache.
		*
		* Note: if `undefined` is specified as a value, this is an alias for
		* {@link LRUCache#delete}
		*
		* Fields on the {@link LRUCache.SetOptions} options param will override
		* their corresponding values in the constructor options for the scope
		* of this single `set()` operation.
		*
		* If `start` is provided, then that will set the effective start
		* time for the TTL calculation. Note that this must be a previous
		* value of `performance.now()` if supported, or a previous value of
		* `Date.now()` if not.
		*
		* Options object may also include `size`, which will prevent
		* calling the `sizeCalculation` function and just use the specified
		* number if it is a positive integer, and `noDisposeOnSet` which
		* will prevent calling a `dispose` function in the case of
		* overwrites.
		*
		* If the `size` (or return value of `sizeCalculation`) for a given
		* entry is greater than `maxEntrySize`, then the item will not be
		* added to the cache.
		*
		* Will update the recency of the entry.
		*
		* If the value is `undefined`, then this is an alias for
		* `cache.delete(key)`. `undefined` is never stored in the cache.
		*/
		set(k, v, setOptions = {}) {
			if (v === void 0) {
				this.delete(k);
				return this;
			}
			const { ttl = this.ttl, start, noDisposeOnSet = this.noDisposeOnSet, sizeCalculation = this.sizeCalculation, status } = setOptions;
			let { noUpdateTTL = this.noUpdateTTL } = setOptions;
			const size = this.#requireSize(k, v, setOptions.size || 0, sizeCalculation);
			if (this.maxEntrySize && size > this.maxEntrySize) {
				if (status) {
					status.set = "miss";
					status.maxEntrySizeExceeded = true;
				}
				this.#delete(k, "set");
				return this;
			}
			let index$1 = this.#size === 0 ? void 0 : this.#keyMap.get(k);
			if (index$1 === void 0) {
				index$1 = this.#size === 0 ? this.#tail : this.#free.length !== 0 ? this.#free.pop() : this.#size === this.#max ? this.#evict(false) : this.#size;
				this.#keyList[index$1] = k;
				this.#valList[index$1] = v;
				this.#keyMap.set(k, index$1);
				this.#next[this.#tail] = index$1;
				this.#prev[index$1] = this.#tail;
				this.#tail = index$1;
				this.#size++;
				this.#addItemSize(index$1, size, status);
				if (status) status.set = "add";
				noUpdateTTL = false;
			} else {
				this.#moveToTail(index$1);
				const oldVal = this.#valList[index$1];
				if (v !== oldVal) {
					if (this.#hasFetchMethod && this.#isBackgroundFetch(oldVal)) {
						oldVal.__abortController.abort(/* @__PURE__ */ new Error("replaced"));
						const { __staleWhileFetching: s } = oldVal;
						if (s !== void 0 && !noDisposeOnSet) {
							if (this.#hasDispose) this.#dispose?.(s, k, "set");
							if (this.#hasDisposeAfter) this.#disposed?.push([
								s,
								k,
								"set"
							]);
						}
					} else if (!noDisposeOnSet) {
						if (this.#hasDispose) this.#dispose?.(oldVal, k, "set");
						if (this.#hasDisposeAfter) this.#disposed?.push([
							oldVal,
							k,
							"set"
						]);
					}
					this.#removeItemSize(index$1);
					this.#addItemSize(index$1, size, status);
					this.#valList[index$1] = v;
					if (status) {
						status.set = "replace";
						const oldValue = oldVal && this.#isBackgroundFetch(oldVal) ? oldVal.__staleWhileFetching : oldVal;
						if (oldValue !== void 0) status.oldValue = oldValue;
					}
				} else if (status) status.set = "update";
			}
			if (ttl !== 0 && !this.#ttls) this.#initializeTTLTracking();
			if (this.#ttls) {
				if (!noUpdateTTL) this.#setItemTTL(index$1, ttl, start);
				if (status) this.#statusTTL(status, index$1);
			}
			if (!noDisposeOnSet && this.#hasDisposeAfter && this.#disposed) {
				const dt = this.#disposed;
				let task;
				while (task = dt?.shift()) this.#disposeAfter?.(...task);
			}
			return this;
		}
		/**
		* Evict the least recently used item, returning its value or
		* `undefined` if cache is empty.
		*/
		pop() {
			try {
				while (this.#size) {
					const val = this.#valList[this.#head];
					this.#evict(true);
					if (this.#isBackgroundFetch(val)) {
						if (val.__staleWhileFetching) return val.__staleWhileFetching;
					} else if (val !== void 0) return val;
				}
			} finally {
				if (this.#hasDisposeAfter && this.#disposed) {
					const dt = this.#disposed;
					let task;
					while (task = dt?.shift()) this.#disposeAfter?.(...task);
				}
			}
		}
		#evict(free) {
			const head = this.#head;
			const k = this.#keyList[head];
			const v = this.#valList[head];
			if (this.#hasFetchMethod && this.#isBackgroundFetch(v)) v.__abortController.abort(/* @__PURE__ */ new Error("evicted"));
			else if (this.#hasDispose || this.#hasDisposeAfter) {
				if (this.#hasDispose) this.#dispose?.(v, k, "evict");
				if (this.#hasDisposeAfter) this.#disposed?.push([
					v,
					k,
					"evict"
				]);
			}
			this.#removeItemSize(head);
			if (free) {
				this.#keyList[head] = void 0;
				this.#valList[head] = void 0;
				this.#free.push(head);
			}
			if (this.#size === 1) {
				this.#head = this.#tail = 0;
				this.#free.length = 0;
			} else this.#head = this.#next[head];
			this.#keyMap.delete(k);
			this.#size--;
			return head;
		}
		/**
		* Check if a key is in the cache, without updating the recency of use.
		* Will return false if the item is stale, even though it is technically
		* in the cache.
		*
		* Check if a key is in the cache, without updating the recency of
		* use. Age is updated if {@link LRUCache.OptionsBase.updateAgeOnHas} is set
		* to `true` in either the options or the constructor.
		*
		* Will return `false` if the item is stale, even though it is technically in
		* the cache. The difference can be determined (if it matters) by using a
		* `status` argument, and inspecting the `has` field.
		*
		* Will not update item age unless
		* {@link LRUCache.OptionsBase.updateAgeOnHas} is set.
		*/
		has(k, hasOptions = {}) {
			const { updateAgeOnHas = this.updateAgeOnHas, status } = hasOptions;
			const index$1 = this.#keyMap.get(k);
			if (index$1 !== void 0) {
				const v = this.#valList[index$1];
				if (this.#isBackgroundFetch(v) && v.__staleWhileFetching === void 0) return false;
				if (!this.#isStale(index$1)) {
					if (updateAgeOnHas) this.#updateItemAge(index$1);
					if (status) {
						status.has = "hit";
						this.#statusTTL(status, index$1);
					}
					return true;
				} else if (status) {
					status.has = "stale";
					this.#statusTTL(status, index$1);
				}
			} else if (status) status.has = "miss";
			return false;
		}
		/**
		* Like {@link LRUCache#get} but doesn't update recency or delete stale
		* items.
		*
		* Returns `undefined` if the item is stale, unless
		* {@link LRUCache.OptionsBase.allowStale} is set.
		*/
		peek(k, peekOptions = {}) {
			const { allowStale = this.allowStale } = peekOptions;
			const index$1 = this.#keyMap.get(k);
			if (index$1 === void 0 || !allowStale && this.#isStale(index$1)) return;
			const v = this.#valList[index$1];
			return this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
		}
		#backgroundFetch(k, index$1, options, context) {
			const v = index$1 === void 0 ? void 0 : this.#valList[index$1];
			if (this.#isBackgroundFetch(v)) return v;
			const ac = new AC();
			const { signal } = options;
			signal?.addEventListener("abort", () => ac.abort(signal.reason), { signal: ac.signal });
			const fetchOpts = {
				signal: ac.signal,
				options,
				context
			};
			const cb = (v$1, updateCache = false) => {
				const { aborted } = ac.signal;
				const ignoreAbort = options.ignoreFetchAbort && v$1 !== void 0;
				if (options.status) if (aborted && !updateCache) {
					options.status.fetchAborted = true;
					options.status.fetchError = ac.signal.reason;
					if (ignoreAbort) options.status.fetchAbortIgnored = true;
				} else options.status.fetchResolved = true;
				if (aborted && !ignoreAbort && !updateCache) return fetchFail(ac.signal.reason);
				const bf$1 = p$1;
				if (this.#valList[index$1] === p$1) if (v$1 === void 0) if (bf$1.__staleWhileFetching) this.#valList[index$1] = bf$1.__staleWhileFetching;
				else this.#delete(k, "fetch");
				else {
					if (options.status) options.status.fetchUpdated = true;
					this.set(k, v$1, fetchOpts.options);
				}
				return v$1;
			};
			const eb = (er) => {
				if (options.status) {
					options.status.fetchRejected = true;
					options.status.fetchError = er;
				}
				return fetchFail(er);
			};
			const fetchFail = (er) => {
				const { aborted } = ac.signal;
				const allowStaleAborted = aborted && options.allowStaleOnFetchAbort;
				const allowStale = allowStaleAborted || options.allowStaleOnFetchRejection;
				const noDelete = allowStale || options.noDeleteOnFetchRejection;
				const bf$1 = p$1;
				if (this.#valList[index$1] === p$1) {
					const del = !noDelete || bf$1.__staleWhileFetching === void 0;
					if (del) this.#delete(k, "fetch");
					else if (!allowStaleAborted) this.#valList[index$1] = bf$1.__staleWhileFetching;
				}
				if (allowStale) {
					if (options.status && bf$1.__staleWhileFetching !== void 0) options.status.returnedStale = true;
					return bf$1.__staleWhileFetching;
				} else if (bf$1.__returned === bf$1) throw er;
			};
			const pcall = (res, rej) => {
				const fmp = this.#fetchMethod?.(k, v, fetchOpts);
				if (fmp && fmp instanceof Promise) fmp.then((v$1) => res(v$1 === void 0 ? void 0 : v$1), rej);
				ac.signal.addEventListener("abort", () => {
					if (!options.ignoreFetchAbort || options.allowStaleOnFetchAbort) {
						res(void 0);
						if (options.allowStaleOnFetchAbort) res = (v$1) => cb(v$1, true);
					}
				});
			};
			if (options.status) options.status.fetchDispatched = true;
			const p$1 = new Promise(pcall).then(cb, eb);
			const bf = Object.assign(p$1, {
				__abortController: ac,
				__staleWhileFetching: v,
				__returned: void 0
			});
			if (index$1 === void 0) {
				this.set(k, bf, {
					...fetchOpts.options,
					status: void 0
				});
				index$1 = this.#keyMap.get(k);
			} else this.#valList[index$1] = bf;
			return bf;
		}
		#isBackgroundFetch(p$1) {
			if (!this.#hasFetchMethod) return false;
			const b = p$1;
			return !!b && b instanceof Promise && b.hasOwnProperty("__staleWhileFetching") && b.__abortController instanceof AC;
		}
		async fetch(k, fetchOptions = {}) {
			const { allowStale = this.allowStale, updateAgeOnGet = this.updateAgeOnGet, noDeleteOnStaleGet = this.noDeleteOnStaleGet, ttl = this.ttl, noDisposeOnSet = this.noDisposeOnSet, size = 0, sizeCalculation = this.sizeCalculation, noUpdateTTL = this.noUpdateTTL, noDeleteOnFetchRejection = this.noDeleteOnFetchRejection, allowStaleOnFetchRejection = this.allowStaleOnFetchRejection, ignoreFetchAbort = this.ignoreFetchAbort, allowStaleOnFetchAbort = this.allowStaleOnFetchAbort, context, forceRefresh = false, status, signal } = fetchOptions;
			if (!this.#hasFetchMethod) {
				if (status) status.fetch = "get";
				return this.get(k, {
					allowStale,
					updateAgeOnGet,
					noDeleteOnStaleGet,
					status
				});
			}
			const options = {
				allowStale,
				updateAgeOnGet,
				noDeleteOnStaleGet,
				ttl,
				noDisposeOnSet,
				size,
				sizeCalculation,
				noUpdateTTL,
				noDeleteOnFetchRejection,
				allowStaleOnFetchRejection,
				allowStaleOnFetchAbort,
				ignoreFetchAbort,
				status,
				signal
			};
			let index$1 = this.#keyMap.get(k);
			if (index$1 === void 0) {
				if (status) status.fetch = "miss";
				const p$1 = this.#backgroundFetch(k, index$1, options, context);
				return p$1.__returned = p$1;
			} else {
				const v = this.#valList[index$1];
				if (this.#isBackgroundFetch(v)) {
					const stale = allowStale && v.__staleWhileFetching !== void 0;
					if (status) {
						status.fetch = "inflight";
						if (stale) status.returnedStale = true;
					}
					return stale ? v.__staleWhileFetching : v.__returned = v;
				}
				const isStale = this.#isStale(index$1);
				if (!forceRefresh && !isStale) {
					if (status) status.fetch = "hit";
					this.#moveToTail(index$1);
					if (updateAgeOnGet) this.#updateItemAge(index$1);
					if (status) this.#statusTTL(status, index$1);
					return v;
				}
				const p$1 = this.#backgroundFetch(k, index$1, options, context);
				const hasStale = p$1.__staleWhileFetching !== void 0;
				const staleVal = hasStale && allowStale;
				if (status) {
					status.fetch = isStale ? "stale" : "refresh";
					if (staleVal && isStale) status.returnedStale = true;
				}
				return staleVal ? p$1.__staleWhileFetching : p$1.__returned = p$1;
			}
		}
		async forceFetch(k, fetchOptions = {}) {
			const v = await this.fetch(k, fetchOptions);
			if (v === void 0) throw new Error("fetch() returned undefined");
			return v;
		}
		memo(k, memoOptions = {}) {
			const memoMethod = this.#memoMethod;
			if (!memoMethod) throw new Error("no memoMethod provided to constructor");
			const { context, forceRefresh,...options } = memoOptions;
			const v = this.get(k, options);
			if (!forceRefresh && v !== void 0) return v;
			const vv = memoMethod(k, v, {
				options,
				context
			});
			this.set(k, vv, options);
			return vv;
		}
		/**
		* Return a value from the cache. Will update the recency of the cache
		* entry found.
		*
		* If the key is not found, get() will return `undefined`.
		*/
		get(k, getOptions = {}) {
			const { allowStale = this.allowStale, updateAgeOnGet = this.updateAgeOnGet, noDeleteOnStaleGet = this.noDeleteOnStaleGet, status } = getOptions;
			const index$1 = this.#keyMap.get(k);
			if (index$1 !== void 0) {
				const value = this.#valList[index$1];
				const fetching = this.#isBackgroundFetch(value);
				if (status) this.#statusTTL(status, index$1);
				if (this.#isStale(index$1)) {
					if (status) status.get = "stale";
					if (!fetching) {
						if (!noDeleteOnStaleGet) this.#delete(k, "expire");
						if (status && allowStale) status.returnedStale = true;
						return allowStale ? value : void 0;
					} else {
						if (status && allowStale && value.__staleWhileFetching !== void 0) status.returnedStale = true;
						return allowStale ? value.__staleWhileFetching : void 0;
					}
				} else {
					if (status) status.get = "hit";
					if (fetching) return value.__staleWhileFetching;
					this.#moveToTail(index$1);
					if (updateAgeOnGet) this.#updateItemAge(index$1);
					return value;
				}
			} else if (status) status.get = "miss";
		}
		#connect(p$1, n) {
			this.#prev[n] = p$1;
			this.#next[p$1] = n;
		}
		#moveToTail(index$1) {
			if (index$1 !== this.#tail) {
				if (index$1 === this.#head) this.#head = this.#next[index$1];
				else this.#connect(this.#prev[index$1], this.#next[index$1]);
				this.#connect(this.#tail, index$1);
				this.#tail = index$1;
			}
		}
		/**
		* Deletes a key out of the cache.
		*
		* Returns true if the key was deleted, false otherwise.
		*/
		delete(k) {
			return this.#delete(k, "delete");
		}
		#delete(k, reason) {
			let deleted = false;
			if (this.#size !== 0) {
				const index$1 = this.#keyMap.get(k);
				if (index$1 !== void 0) {
					deleted = true;
					if (this.#size === 1) this.#clear(reason);
					else {
						this.#removeItemSize(index$1);
						const v = this.#valList[index$1];
						if (this.#isBackgroundFetch(v)) v.__abortController.abort(/* @__PURE__ */ new Error("deleted"));
						else if (this.#hasDispose || this.#hasDisposeAfter) {
							if (this.#hasDispose) this.#dispose?.(v, k, reason);
							if (this.#hasDisposeAfter) this.#disposed?.push([
								v,
								k,
								reason
							]);
						}
						this.#keyMap.delete(k);
						this.#keyList[index$1] = void 0;
						this.#valList[index$1] = void 0;
						if (index$1 === this.#tail) this.#tail = this.#prev[index$1];
						else if (index$1 === this.#head) this.#head = this.#next[index$1];
						else {
							const pi = this.#prev[index$1];
							this.#next[pi] = this.#next[index$1];
							const ni = this.#next[index$1];
							this.#prev[ni] = this.#prev[index$1];
						}
						this.#size--;
						this.#free.push(index$1);
					}
				}
			}
			if (this.#hasDisposeAfter && this.#disposed?.length) {
				const dt = this.#disposed;
				let task;
				while (task = dt?.shift()) this.#disposeAfter?.(...task);
			}
			return deleted;
		}
		/**
		* Clear the cache entirely, throwing away all values.
		*/
		clear() {
			return this.#clear("delete");
		}
		#clear(reason) {
			for (const index$1 of this.#rindexes({ allowStale: true })) {
				const v = this.#valList[index$1];
				if (this.#isBackgroundFetch(v)) v.__abortController.abort(/* @__PURE__ */ new Error("deleted"));
				else {
					const k = this.#keyList[index$1];
					if (this.#hasDispose) this.#dispose?.(v, k, reason);
					if (this.#hasDisposeAfter) this.#disposed?.push([
						v,
						k,
						reason
					]);
				}
			}
			this.#keyMap.clear();
			this.#valList.fill(void 0);
			this.#keyList.fill(void 0);
			if (this.#ttls && this.#starts) {
				this.#ttls.fill(0);
				this.#starts.fill(0);
			}
			if (this.#sizes) this.#sizes.fill(0);
			this.#head = 0;
			this.#tail = 0;
			this.#free.length = 0;
			this.#calculatedSize = 0;
			this.#size = 0;
			if (this.#hasDisposeAfter && this.#disposed) {
				const dt = this.#disposed;
				let task;
				while (task = dt?.shift()) this.#disposeAfter?.(...task);
			}
		}
	};
	exports.LRUCache = LRUCache$1;
}) });

//#endregion
//#region ../../../node_modules/.pnpm/hosted-git-info@7.0.2/node_modules/hosted-git-info/lib/hosts.js
var require_hosts = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/hosted-git-info@7.0.2/node_modules/hosted-git-info/lib/hosts.js": ((exports, module) => {
	const maybeJoin = (...args) => args.every((arg) => arg) ? args.join("") : "";
	const maybeEncode = (arg) => arg ? encodeURIComponent(arg) : "";
	const formatHashFragment = (f) => f.toLowerCase().replace(/^\W+|\/|\W+$/g, "").replace(/\W+/g, "-");
	const defaults = {
		sshtemplate: ({ domain, user, project, committish }) => `git@${domain}:${user}/${project}.git${maybeJoin("#", committish)}`,
		sshurltemplate: ({ domain, user, project, committish }) => `git+ssh://git@${domain}/${user}/${project}.git${maybeJoin("#", committish)}`,
		edittemplate: ({ domain, user, project, committish, editpath, path: path$1 }) => `https://${domain}/${user}/${project}${maybeJoin("/", editpath, "/", maybeEncode(committish || "HEAD"), "/", path$1)}`,
		browsetemplate: ({ domain, user, project, committish, treepath }) => `https://${domain}/${user}/${project}${maybeJoin("/", treepath, "/", maybeEncode(committish))}`,
		browsetreetemplate: ({ domain, user, project, committish, treepath, path: path$1, fragment, hashformat }) => `https://${domain}/${user}/${project}/${treepath}/${maybeEncode(committish || "HEAD")}/${path$1}${maybeJoin("#", hashformat(fragment || ""))}`,
		browseblobtemplate: ({ domain, user, project, committish, blobpath, path: path$1, fragment, hashformat }) => `https://${domain}/${user}/${project}/${blobpath}/${maybeEncode(committish || "HEAD")}/${path$1}${maybeJoin("#", hashformat(fragment || ""))}`,
		docstemplate: ({ domain, user, project, treepath, committish }) => `https://${domain}/${user}/${project}${maybeJoin("/", treepath, "/", maybeEncode(committish))}#readme`,
		httpstemplate: ({ auth, domain, user, project, committish }) => `git+https://${maybeJoin(auth, "@")}${domain}/${user}/${project}.git${maybeJoin("#", committish)}`,
		filetemplate: ({ domain, user, project, committish, path: path$1 }) => `https://${domain}/${user}/${project}/raw/${maybeEncode(committish || "HEAD")}/${path$1}`,
		shortcuttemplate: ({ type, user, project, committish }) => `${type}:${user}/${project}${maybeJoin("#", committish)}`,
		pathtemplate: ({ user, project, committish }) => `${user}/${project}${maybeJoin("#", committish)}`,
		bugstemplate: ({ domain, user, project }) => `https://${domain}/${user}/${project}/issues`,
		hashformat: formatHashFragment
	};
	const hosts$1 = {};
	hosts$1.github = {
		protocols: [
			"git:",
			"http:",
			"git+ssh:",
			"git+https:",
			"ssh:",
			"https:"
		],
		domain: "github.com",
		treepath: "tree",
		blobpath: "blob",
		editpath: "edit",
		filetemplate: ({ auth, user, project, committish, path: path$1 }) => `https://${maybeJoin(auth, "@")}raw.githubusercontent.com/${user}/${project}/${maybeEncode(committish || "HEAD")}/${path$1}`,
		gittemplate: ({ auth, domain, user, project, committish }) => `git://${maybeJoin(auth, "@")}${domain}/${user}/${project}.git${maybeJoin("#", committish)}`,
		tarballtemplate: ({ domain, user, project, committish }) => `https://codeload.${domain}/${user}/${project}/tar.gz/${maybeEncode(committish || "HEAD")}`,
		extract: (url$2) => {
			let [, user, project, type, committish] = url$2.pathname.split("/", 5);
			if (type && type !== "tree") return;
			if (!type) committish = url$2.hash.slice(1);
			if (project && project.endsWith(".git")) project = project.slice(0, -4);
			if (!user || !project) return;
			return {
				user,
				project,
				committish
			};
		}
	};
	hosts$1.bitbucket = {
		protocols: [
			"git+ssh:",
			"git+https:",
			"ssh:",
			"https:"
		],
		domain: "bitbucket.org",
		treepath: "src",
		blobpath: "src",
		editpath: "?mode=edit",
		edittemplate: ({ domain, user, project, committish, treepath, path: path$1, editpath }) => `https://${domain}/${user}/${project}${maybeJoin("/", treepath, "/", maybeEncode(committish || "HEAD"), "/", path$1, editpath)}`,
		tarballtemplate: ({ domain, user, project, committish }) => `https://${domain}/${user}/${project}/get/${maybeEncode(committish || "HEAD")}.tar.gz`,
		extract: (url$2) => {
			let [, user, project, aux] = url$2.pathname.split("/", 4);
			if (["get"].includes(aux)) return;
			if (project && project.endsWith(".git")) project = project.slice(0, -4);
			if (!user || !project) return;
			return {
				user,
				project,
				committish: url$2.hash.slice(1)
			};
		}
	};
	hosts$1.gitlab = {
		protocols: [
			"git+ssh:",
			"git+https:",
			"ssh:",
			"https:"
		],
		domain: "gitlab.com",
		treepath: "tree",
		blobpath: "tree",
		editpath: "-/edit",
		httpstemplate: ({ auth, domain, user, project, committish }) => `git+https://${maybeJoin(auth, "@")}${domain}/${user}/${project}.git${maybeJoin("#", committish)}`,
		tarballtemplate: ({ domain, user, project, committish }) => `https://${domain}/${user}/${project}/repository/archive.tar.gz?ref=${maybeEncode(committish || "HEAD")}`,
		extract: (url$2) => {
			const path$1 = url$2.pathname.slice(1);
			if (path$1.includes("/-/") || path$1.includes("/archive.tar.gz")) return;
			const segments = path$1.split("/");
			let project = segments.pop();
			if (project.endsWith(".git")) project = project.slice(0, -4);
			const user = segments.join("/");
			if (!user || !project) return;
			return {
				user,
				project,
				committish: url$2.hash.slice(1)
			};
		}
	};
	hosts$1.gist = {
		protocols: [
			"git:",
			"git+ssh:",
			"git+https:",
			"ssh:",
			"https:"
		],
		domain: "gist.github.com",
		editpath: "edit",
		sshtemplate: ({ domain, project, committish }) => `git@${domain}:${project}.git${maybeJoin("#", committish)}`,
		sshurltemplate: ({ domain, project, committish }) => `git+ssh://git@${domain}/${project}.git${maybeJoin("#", committish)}`,
		edittemplate: ({ domain, user, project, committish, editpath }) => `https://${domain}/${user}/${project}${maybeJoin("/", maybeEncode(committish))}/${editpath}`,
		browsetemplate: ({ domain, project, committish }) => `https://${domain}/${project}${maybeJoin("/", maybeEncode(committish))}`,
		browsetreetemplate: ({ domain, project, committish, path: path$1, hashformat }) => `https://${domain}/${project}${maybeJoin("/", maybeEncode(committish))}${maybeJoin("#", hashformat(path$1))}`,
		browseblobtemplate: ({ domain, project, committish, path: path$1, hashformat }) => `https://${domain}/${project}${maybeJoin("/", maybeEncode(committish))}${maybeJoin("#", hashformat(path$1))}`,
		docstemplate: ({ domain, project, committish }) => `https://${domain}/${project}${maybeJoin("/", maybeEncode(committish))}`,
		httpstemplate: ({ domain, project, committish }) => `git+https://${domain}/${project}.git${maybeJoin("#", committish)}`,
		filetemplate: ({ user, project, committish, path: path$1 }) => `https://gist.githubusercontent.com/${user}/${project}/raw${maybeJoin("/", maybeEncode(committish))}/${path$1}`,
		shortcuttemplate: ({ type, project, committish }) => `${type}:${project}${maybeJoin("#", committish)}`,
		pathtemplate: ({ project, committish }) => `${project}${maybeJoin("#", committish)}`,
		bugstemplate: ({ domain, project }) => `https://${domain}/${project}`,
		gittemplate: ({ domain, project, committish }) => `git://${domain}/${project}.git${maybeJoin("#", committish)}`,
		tarballtemplate: ({ project, committish }) => `https://codeload.github.com/gist/${project}/tar.gz/${maybeEncode(committish || "HEAD")}`,
		extract: (url$2) => {
			let [, user, project, aux] = url$2.pathname.split("/", 4);
			if (aux === "raw") return;
			if (!project) {
				if (!user) return;
				project = user;
				user = null;
			}
			if (project.endsWith(".git")) project = project.slice(0, -4);
			return {
				user,
				project,
				committish: url$2.hash.slice(1)
			};
		},
		hashformat: function(fragment) {
			return fragment && "file-" + formatHashFragment(fragment);
		}
	};
	hosts$1.sourcehut = {
		protocols: ["git+ssh:", "https:"],
		domain: "git.sr.ht",
		treepath: "tree",
		blobpath: "tree",
		filetemplate: ({ domain, user, project, committish, path: path$1 }) => `https://${domain}/${user}/${project}/blob/${maybeEncode(committish) || "HEAD"}/${path$1}`,
		httpstemplate: ({ domain, user, project, committish }) => `https://${domain}/${user}/${project}.git${maybeJoin("#", committish)}`,
		tarballtemplate: ({ domain, user, project, committish }) => `https://${domain}/${user}/${project}/archive/${maybeEncode(committish) || "HEAD"}.tar.gz`,
		bugstemplate: () => null,
		extract: (url$2) => {
			let [, user, project, aux] = url$2.pathname.split("/", 4);
			if (["archive"].includes(aux)) return;
			if (project && project.endsWith(".git")) project = project.slice(0, -4);
			if (!user || !project) return;
			return {
				user,
				project,
				committish: url$2.hash.slice(1)
			};
		}
	};
	for (const [name, host] of Object.entries(hosts$1)) hosts$1[name] = Object.assign({}, defaults, host);
	module.exports = hosts$1;
}) });

//#endregion
//#region ../../../node_modules/.pnpm/hosted-git-info@7.0.2/node_modules/hosted-git-info/lib/parse-url.js
var require_parse_url = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/hosted-git-info@7.0.2/node_modules/hosted-git-info/lib/parse-url.js": ((exports, module) => {
	const url$1 = __require("url");
	const lastIndexOfBefore = (str, char, beforeChar) => {
		const startPosition = str.indexOf(beforeChar);
		return str.lastIndexOf(char, startPosition > -1 ? startPosition : Infinity);
	};
	const safeUrl = (u) => {
		try {
			return new url$1.URL(u);
		} catch {}
	};
	const correctProtocol = (arg, protocols) => {
		const firstColon = arg.indexOf(":");
		const proto = arg.slice(0, firstColon + 1);
		if (Object.prototype.hasOwnProperty.call(protocols, proto)) return arg;
		const firstAt = arg.indexOf("@");
		if (firstAt > -1) if (firstAt > firstColon) return `git+ssh://${arg}`;
		else return arg;
		const doubleSlash = arg.indexOf("//");
		if (doubleSlash === firstColon + 1) return arg;
		return `${arg.slice(0, firstColon + 1)}//${arg.slice(firstColon + 1)}`;
	};
	const correctUrl = (giturl) => {
		const firstAt = lastIndexOfBefore(giturl, "@", "#");
		const lastColonBeforeHash = lastIndexOfBefore(giturl, ":", "#");
		if (lastColonBeforeHash > firstAt) giturl = giturl.slice(0, lastColonBeforeHash) + "/" + giturl.slice(lastColonBeforeHash + 1);
		if (lastIndexOfBefore(giturl, ":", "#") === -1 && giturl.indexOf("//") === -1) giturl = `git+ssh://${giturl}`;
		return giturl;
	};
	module.exports = (giturl, protocols) => {
		const withProtocol = protocols ? correctProtocol(giturl, protocols) : giturl;
		return safeUrl(withProtocol) || safeUrl(correctUrl(withProtocol));
	};
}) });

//#endregion
//#region ../../../node_modules/.pnpm/hosted-git-info@7.0.2/node_modules/hosted-git-info/lib/from-url.js
var require_from_url = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/hosted-git-info@7.0.2/node_modules/hosted-git-info/lib/from-url.js": ((exports, module) => {
	const parseUrl$1 = require_parse_url();
	const isGitHubShorthand = (arg) => {
		const firstHash = arg.indexOf("#");
		const firstSlash = arg.indexOf("/");
		const secondSlash = arg.indexOf("/", firstSlash + 1);
		const firstColon = arg.indexOf(":");
		const firstSpace = /\s/.exec(arg);
		const firstAt = arg.indexOf("@");
		const spaceOnlyAfterHash = !firstSpace || firstHash > -1 && firstSpace.index > firstHash;
		const atOnlyAfterHash = firstAt === -1 || firstHash > -1 && firstAt > firstHash;
		const colonOnlyAfterHash = firstColon === -1 || firstHash > -1 && firstColon > firstHash;
		const secondSlashOnlyAfterHash = secondSlash === -1 || firstHash > -1 && secondSlash > firstHash;
		const hasSlash = firstSlash > 0;
		const doesNotEndWithSlash = firstHash > -1 ? arg[firstHash - 1] !== "/" : !arg.endsWith("/");
		const doesNotStartWithDot = !arg.startsWith(".");
		return spaceOnlyAfterHash && hasSlash && doesNotEndWithSlash && doesNotStartWithDot && atOnlyAfterHash && colonOnlyAfterHash && secondSlashOnlyAfterHash;
	};
	module.exports = (giturl, opts, { gitHosts, protocols }) => {
		if (!giturl) return;
		const correctedUrl = isGitHubShorthand(giturl) ? `github:${giturl}` : giturl;
		const parsed = parseUrl$1(correctedUrl, protocols);
		if (!parsed) return;
		const gitHostShortcut = gitHosts.byShortcut[parsed.protocol];
		const gitHostDomain = gitHosts.byDomain[parsed.hostname.startsWith("www.") ? parsed.hostname.slice(4) : parsed.hostname];
		const gitHostName = gitHostShortcut || gitHostDomain;
		if (!gitHostName) return;
		const gitHostInfo = gitHosts[gitHostShortcut || gitHostDomain];
		let auth = null;
		if (protocols[parsed.protocol]?.auth && (parsed.username || parsed.password)) auth = `${parsed.username}${parsed.password ? ":" + parsed.password : ""}`;
		let committish = null;
		let user = null;
		let project = null;
		let defaultRepresentation = null;
		try {
			if (gitHostShortcut) {
				let pathname = parsed.pathname.startsWith("/") ? parsed.pathname.slice(1) : parsed.pathname;
				const firstAt = pathname.indexOf("@");
				if (firstAt > -1) pathname = pathname.slice(firstAt + 1);
				const lastSlash = pathname.lastIndexOf("/");
				if (lastSlash > -1) {
					user = decodeURIComponent(pathname.slice(0, lastSlash));
					if (!user) user = null;
					project = decodeURIComponent(pathname.slice(lastSlash + 1));
				} else project = decodeURIComponent(pathname);
				if (project.endsWith(".git")) project = project.slice(0, -4);
				if (parsed.hash) committish = decodeURIComponent(parsed.hash.slice(1));
				defaultRepresentation = "shortcut";
			} else {
				if (!gitHostInfo.protocols.includes(parsed.protocol)) return;
				const segments = gitHostInfo.extract(parsed);
				if (!segments) return;
				user = segments.user && decodeURIComponent(segments.user);
				project = decodeURIComponent(segments.project);
				committish = decodeURIComponent(segments.committish);
				defaultRepresentation = protocols[parsed.protocol]?.name || parsed.protocol.slice(0, -1);
			}
		} catch (err) {
			/* istanbul ignore else */
			if (err instanceof URIError) return;
			else throw err;
		}
		return [
			gitHostName,
			user,
			auth,
			project,
			committish,
			defaultRepresentation,
			opts
		];
	};
}) });

//#endregion
//#region ../../../node_modules/.pnpm/hosted-git-info@7.0.2/node_modules/hosted-git-info/lib/index.js
var require_lib = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/hosted-git-info@7.0.2/node_modules/hosted-git-info/lib/index.js": ((exports, module) => {
	const { LRUCache } = require_commonjs();
	const hosts = require_hosts();
	const fromUrl = require_from_url();
	const parseUrl = require_parse_url();
	const cache = new LRUCache({ max: 1e3 });
	var GitHost = class GitHost {
		constructor(type, user, auth, project, committish, defaultRepresentation, opts = {}) {
			Object.assign(this, GitHost.#gitHosts[type], {
				type,
				user,
				auth,
				project,
				committish,
				default: defaultRepresentation,
				opts
			});
		}
		static #gitHosts = {
			byShortcut: {},
			byDomain: {}
		};
		static #protocols = {
			"git+ssh:": { name: "sshurl" },
			"ssh:": { name: "sshurl" },
			"git+https:": {
				name: "https",
				auth: true
			},
			"git:": { auth: true },
			"http:": { auth: true },
			"https:": { auth: true },
			"git+http:": { auth: true }
		};
		static addHost(name, host) {
			GitHost.#gitHosts[name] = host;
			GitHost.#gitHosts.byDomain[host.domain] = name;
			GitHost.#gitHosts.byShortcut[`${name}:`] = name;
			GitHost.#protocols[`${name}:`] = { name };
		}
		static fromUrl(giturl, opts) {
			if (typeof giturl !== "string") return;
			const key = giturl + JSON.stringify(opts || {});
			if (!cache.has(key)) {
				const hostArgs = fromUrl(giturl, opts, {
					gitHosts: GitHost.#gitHosts,
					protocols: GitHost.#protocols
				});
				cache.set(key, hostArgs ? new GitHost(...hostArgs) : void 0);
			}
			return cache.get(key);
		}
		static parseUrl(url$2) {
			return parseUrl(url$2);
		}
		#fill(template, opts) {
			if (typeof template !== "function") return null;
			const options = {
				...this,
				...this.opts,
				...opts
			};
			if (!options.path) options.path = "";
			if (options.path.startsWith("/")) options.path = options.path.slice(1);
			if (options.noCommittish) options.committish = null;
			const result = template(options);
			return options.noGitPlus && result.startsWith("git+") ? result.slice(4) : result;
		}
		hash() {
			return this.committish ? `#${this.committish}` : "";
		}
		ssh(opts) {
			return this.#fill(this.sshtemplate, opts);
		}
		sshurl(opts) {
			return this.#fill(this.sshurltemplate, opts);
		}
		browse(path$1, ...args) {
			if (typeof path$1 !== "string") return this.#fill(this.browsetemplate, path$1);
			if (typeof args[0] !== "string") return this.#fill(this.browsetreetemplate, {
				...args[0],
				path: path$1
			});
			return this.#fill(this.browsetreetemplate, {
				...args[1],
				fragment: args[0],
				path: path$1
			});
		}
		browseFile(path$1, ...args) {
			if (typeof args[0] !== "string") return this.#fill(this.browseblobtemplate, {
				...args[0],
				path: path$1
			});
			return this.#fill(this.browseblobtemplate, {
				...args[1],
				fragment: args[0],
				path: path$1
			});
		}
		docs(opts) {
			return this.#fill(this.docstemplate, opts);
		}
		bugs(opts) {
			return this.#fill(this.bugstemplate, opts);
		}
		https(opts) {
			return this.#fill(this.httpstemplate, opts);
		}
		git(opts) {
			return this.#fill(this.gittemplate, opts);
		}
		shortcut(opts) {
			return this.#fill(this.shortcuttemplate, opts);
		}
		path(opts) {
			return this.#fill(this.pathtemplate, opts);
		}
		tarball(opts) {
			return this.#fill(this.tarballtemplate, {
				...opts,
				noCommittish: false
			});
		}
		file(path$1, opts) {
			return this.#fill(this.filetemplate, {
				...opts,
				path: path$1
			});
		}
		edit(path$1, opts) {
			return this.#fill(this.edittemplate, {
				...opts,
				path: path$1
			});
		}
		getDefaultRepresentation() {
			return this.default;
		}
		toString(opts) {
			if (this.default && typeof this[this.default] === "function") return this[this.default](opts);
			return this.sshurl(opts);
		}
	};
	for (const [name, host] of Object.entries(hosts)) GitHost.addHost(name, host);
	module.exports = GitHost;
}) });

//#endregion
//#region ../../../node_modules/.pnpm/normalize-package-data@6.0.2/node_modules/normalize-package-data/lib/extract_description.js
var require_extract_description = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/normalize-package-data@6.0.2/node_modules/normalize-package-data/lib/extract_description.js": ((exports, module) => {
	module.exports = extractDescription$1;
	function extractDescription$1(d) {
		if (!d) return;
		if (d === "ERROR: No README data found!") return;
		d = d.trim().split("\n");
		let s = 0;
		while (d[s] && d[s].trim().match(/^(#|$)/)) s++;
		const l = d.length;
		let e = s + 1;
		while (e < l && d[e].trim()) e++;
		return d.slice(s, e).join(" ").trim();
	}
}) });

//#endregion
//#region ../../../node_modules/.pnpm/normalize-package-data@6.0.2/node_modules/normalize-package-data/lib/typos.json
var require_typos = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/normalize-package-data@6.0.2/node_modules/normalize-package-data/lib/typos.json": ((exports, module) => {
	module.exports = {
		"topLevel": {
			"dependancies": "dependencies",
			"dependecies": "dependencies",
			"depdenencies": "dependencies",
			"devEependencies": "devDependencies",
			"depends": "dependencies",
			"dev-dependencies": "devDependencies",
			"devDependences": "devDependencies",
			"devDepenencies": "devDependencies",
			"devdependencies": "devDependencies",
			"repostitory": "repository",
			"repo": "repository",
			"prefereGlobal": "preferGlobal",
			"hompage": "homepage",
			"hampage": "homepage",
			"autohr": "author",
			"autor": "author",
			"contributers": "contributors",
			"publicationConfig": "publishConfig",
			"script": "scripts"
		},
		"bugs": {
			"web": "url",
			"name": "url"
		},
		"script": {
			"server": "start",
			"tests": "test"
		}
	};
}) });

//#endregion
//#region ../../../node_modules/.pnpm/normalize-package-data@6.0.2/node_modules/normalize-package-data/lib/fixer.js
var require_fixer = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/normalize-package-data@6.0.2/node_modules/normalize-package-data/lib/fixer.js": ((exports, module) => {
	var isValidSemver = require_valid();
	var cleanSemver = require_clean();
	var validateLicense = require_validate_npm_package_license();
	var hostedGitInfo = require_lib();
	var moduleBuiltin = __require("node:module");
	var depTypes = [
		"dependencies",
		"devDependencies",
		"optionalDependencies"
	];
	var extractDescription = require_extract_description();
	var url = __require("url");
	var typos = require_typos();
	var isEmail = (str) => str.includes("@") && str.indexOf("@") < str.lastIndexOf(".");
	module.exports = {
		warn: function() {},
		fixRepositoryField: function(data) {
			if (data.repositories) {
				this.warn("repositories");
				data.repository = data.repositories[0];
			}
			if (!data.repository) return this.warn("missingRepository");
			if (typeof data.repository === "string") data.repository = {
				type: "git",
				url: data.repository
			};
			var r = data.repository.url || "";
			if (r) {
				var hosted = hostedGitInfo.fromUrl(r);
				if (hosted) r = data.repository.url = hosted.getDefaultRepresentation() === "shortcut" ? hosted.https() : hosted.toString();
			}
			if (r.match(/github.com\/[^/]+\/[^/]+\.git\.git$/)) this.warn("brokenGitUrl", r);
		},
		fixTypos: function(data) {
			Object.keys(typos.topLevel).forEach(function(d) {
				if (Object.prototype.hasOwnProperty.call(data, d)) this.warn("typo", d, typos.topLevel[d]);
			}, this);
		},
		fixScriptsField: function(data) {
			if (!data.scripts) return;
			if (typeof data.scripts !== "object") {
				this.warn("nonObjectScripts");
				delete data.scripts;
				return;
			}
			Object.keys(data.scripts).forEach(function(k) {
				if (typeof data.scripts[k] !== "string") {
					this.warn("nonStringScript");
					delete data.scripts[k];
				} else if (typos.script[k] && !data.scripts[typos.script[k]]) this.warn("typo", k, typos.script[k], "scripts");
			}, this);
		},
		fixFilesField: function(data) {
			var files = data.files;
			if (files && !Array.isArray(files)) {
				this.warn("nonArrayFiles");
				delete data.files;
			} else if (data.files) data.files = data.files.filter(function(file) {
				if (!file || typeof file !== "string") {
					this.warn("invalidFilename", file);
					return false;
				} else return true;
			}, this);
		},
		fixBinField: function(data) {
			if (!data.bin) return;
			if (typeof data.bin === "string") {
				var b = {};
				var match;
				if (match = data.name.match(/^@[^/]+[/](.*)$/)) b[match[1]] = data.bin;
				else b[data.name] = data.bin;
				data.bin = b;
			}
		},
		fixManField: function(data) {
			if (!data.man) return;
			if (typeof data.man === "string") data.man = [data.man];
		},
		fixBundleDependenciesField: function(data) {
			var bdd = "bundledDependencies";
			var bd = "bundleDependencies";
			if (data[bdd] && !data[bd]) {
				data[bd] = data[bdd];
				delete data[bdd];
			}
			if (data[bd] && !Array.isArray(data[bd])) {
				this.warn("nonArrayBundleDependencies");
				delete data[bd];
			} else if (data[bd]) data[bd] = data[bd].filter(function(filtered) {
				if (!filtered || typeof filtered !== "string") {
					this.warn("nonStringBundleDependency", filtered);
					return false;
				} else {
					if (!data.dependencies) data.dependencies = {};
					if (!Object.prototype.hasOwnProperty.call(data.dependencies, filtered)) {
						this.warn("nonDependencyBundleDependency", filtered);
						data.dependencies[filtered] = "*";
					}
					return true;
				}
			}, this);
		},
		fixDependencies: function(data) {
			objectifyDeps(data, this.warn);
			addOptionalDepsToDeps(data, this.warn);
			this.fixBundleDependenciesField(data);
			["dependencies", "devDependencies"].forEach(function(deps) {
				if (!(deps in data)) return;
				if (!data[deps] || typeof data[deps] !== "object") {
					this.warn("nonObjectDependencies", deps);
					delete data[deps];
					return;
				}
				Object.keys(data[deps]).forEach(function(d) {
					var r = data[deps][d];
					if (typeof r !== "string") {
						this.warn("nonStringDependency", d, JSON.stringify(r));
						delete data[deps][d];
					}
					var hosted = hostedGitInfo.fromUrl(data[deps][d]);
					if (hosted) data[deps][d] = hosted.toString();
				}, this);
			}, this);
		},
		fixModulesField: function(data) {
			if (data.modules) {
				this.warn("deprecatedModules");
				delete data.modules;
			}
		},
		fixKeywordsField: function(data) {
			if (typeof data.keywords === "string") data.keywords = data.keywords.split(/,\s+/);
			if (data.keywords && !Array.isArray(data.keywords)) {
				delete data.keywords;
				this.warn("nonArrayKeywords");
			} else if (data.keywords) data.keywords = data.keywords.filter(function(kw) {
				if (typeof kw !== "string" || !kw) {
					this.warn("nonStringKeyword");
					return false;
				} else return true;
			}, this);
		},
		fixVersionField: function(data, strict) {
			var loose = !strict;
			if (!data.version) {
				data.version = "";
				return true;
			}
			if (!isValidSemver(data.version, loose)) throw new Error("Invalid version: \"" + data.version + "\"");
			data.version = cleanSemver(data.version, loose);
			return true;
		},
		fixPeople: function(data) {
			modifyPeople(data, unParsePerson);
			modifyPeople(data, parsePerson);
		},
		fixNameField: function(data, options) {
			if (typeof options === "boolean") options = { strict: options };
			else if (typeof options === "undefined") options = {};
			var strict = options.strict;
			if (!data.name && !strict) {
				data.name = "";
				return;
			}
			if (typeof data.name !== "string") throw new Error("name field must be a string.");
			if (!strict) data.name = data.name.trim();
			ensureValidName(data.name, strict, options.allowLegacyCase);
			if (moduleBuiltin.builtinModules.includes(data.name)) this.warn("conflictingName", data.name);
		},
		fixDescriptionField: function(data) {
			if (data.description && typeof data.description !== "string") {
				this.warn("nonStringDescription");
				delete data.description;
			}
			if (data.readme && !data.description) data.description = extractDescription(data.readme);
			if (data.description === void 0) delete data.description;
			if (!data.description) this.warn("missingDescription");
		},
		fixReadmeField: function(data) {
			if (!data.readme) {
				this.warn("missingReadme");
				data.readme = "ERROR: No README data found!";
			}
		},
		fixBugsField: function(data) {
			if (!data.bugs && data.repository && data.repository.url) {
				var hosted = hostedGitInfo.fromUrl(data.repository.url);
				if (hosted && hosted.bugs()) data.bugs = { url: hosted.bugs() };
			} else if (data.bugs) {
				if (typeof data.bugs === "string") if (isEmail(data.bugs)) data.bugs = { email: data.bugs };
				else if (url.parse(data.bugs).protocol) data.bugs = { url: data.bugs };
				else this.warn("nonEmailUrlBugsString");
				else {
					bugsTypos(data.bugs, this.warn);
					var oldBugs = data.bugs;
					data.bugs = {};
					if (oldBugs.url) if (typeof oldBugs.url === "string" && url.parse(oldBugs.url).protocol) data.bugs.url = oldBugs.url;
					else this.warn("nonUrlBugsUrlField");
					if (oldBugs.email) if (typeof oldBugs.email === "string" && isEmail(oldBugs.email)) data.bugs.email = oldBugs.email;
					else this.warn("nonEmailBugsEmailField");
				}
				if (!data.bugs.email && !data.bugs.url) {
					delete data.bugs;
					this.warn("emptyNormalizedBugs");
				}
			}
		},
		fixHomepageField: function(data) {
			if (!data.homepage && data.repository && data.repository.url) {
				var hosted = hostedGitInfo.fromUrl(data.repository.url);
				if (hosted && hosted.docs()) data.homepage = hosted.docs();
			}
			if (!data.homepage) return;
			if (typeof data.homepage !== "string") {
				this.warn("nonUrlHomepage");
				return delete data.homepage;
			}
			if (!url.parse(data.homepage).protocol) data.homepage = "http://" + data.homepage;
		},
		fixLicenseField: function(data) {
			const license = data.license || data.licence;
			if (!license) return this.warn("missingLicense");
			if (typeof license !== "string" || license.length < 1 || license.trim() === "") return this.warn("invalidLicense");
			if (!validateLicense(license).validForNewPackages) return this.warn("invalidLicense");
		}
	};
	function isValidScopedPackageName(spec) {
		if (spec.charAt(0) !== "@") return false;
		var rest = spec.slice(1).split("/");
		if (rest.length !== 2) return false;
		return rest[0] && rest[1] && rest[0] === encodeURIComponent(rest[0]) && rest[1] === encodeURIComponent(rest[1]);
	}
	function isCorrectlyEncodedName(spec) {
		return !spec.match(/[/@\s+%:]/) && spec === encodeURIComponent(spec);
	}
	function ensureValidName(name, strict, allowLegacyCase) {
		if (name.charAt(0) === "." || !(isValidScopedPackageName(name) || isCorrectlyEncodedName(name)) || strict && !allowLegacyCase && name !== name.toLowerCase() || name.toLowerCase() === "node_modules" || name.toLowerCase() === "favicon.ico") throw new Error("Invalid name: " + JSON.stringify(name));
	}
	function modifyPeople(data, fn) {
		if (data.author) data.author = fn(data.author);
		["maintainers", "contributors"].forEach(function(set) {
			if (!Array.isArray(data[set])) return;
			data[set] = data[set].map(fn);
		});
		return data;
	}
	function unParsePerson(person) {
		if (typeof person === "string") return person;
		var name = person.name || "";
		var u = person.url || person.web;
		var wrappedUrl = u ? " (" + u + ")" : "";
		var e = person.email || person.mail;
		var wrappedEmail = e ? " <" + e + ">" : "";
		return name + wrappedEmail + wrappedUrl;
	}
	function parsePerson(person) {
		if (typeof person !== "string") return person;
		var matchedName = person.match(/^([^(<]+)/);
		var matchedUrl = person.match(/\(([^()]+)\)/);
		var matchedEmail = person.match(/<([^<>]+)>/);
		var obj = {};
		if (matchedName && matchedName[0].trim()) obj.name = matchedName[0].trim();
		if (matchedEmail) obj.email = matchedEmail[1];
		if (matchedUrl) obj.url = matchedUrl[1];
		return obj;
	}
	function addOptionalDepsToDeps(data) {
		var o = data.optionalDependencies;
		if (!o) return;
		var d = data.dependencies || {};
		Object.keys(o).forEach(function(k) {
			d[k] = o[k];
		});
		data.dependencies = d;
	}
	function depObjectify(deps, type, warn) {
		if (!deps) return {};
		if (typeof deps === "string") deps = deps.trim().split(/[\n\r\s\t ,]+/);
		if (!Array.isArray(deps)) return deps;
		warn("deprecatedArrayDependencies", type);
		var o = {};
		deps.filter(function(d) {
			return typeof d === "string";
		}).forEach(function(d) {
			d = d.trim().split(/(:?[@\s><=])/);
			var dn = d.shift();
			var dv = d.join("");
			dv = dv.trim();
			dv = dv.replace(/^@/, "");
			o[dn] = dv;
		});
		return o;
	}
	function objectifyDeps(data, warn) {
		depTypes.forEach(function(type) {
			if (!data[type]) return;
			data[type] = depObjectify(data[type], type, warn);
		});
	}
	function bugsTypos(bugs, warn) {
		if (!bugs) return;
		Object.keys(bugs).forEach(function(k) {
			if (typos.bugs[k]) {
				warn("typo", k, typos.bugs[k], "bugs");
				bugs[typos.bugs[k]] = bugs[k];
				delete bugs[k];
			}
		});
	}
}) });

//#endregion
//#region ../../../node_modules/.pnpm/normalize-package-data@6.0.2/node_modules/normalize-package-data/lib/warning_messages.json
var require_warning_messages = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/normalize-package-data@6.0.2/node_modules/normalize-package-data/lib/warning_messages.json": ((exports, module) => {
	module.exports = {
		"repositories": "'repositories' (plural) Not supported. Please pick one as the 'repository' field",
		"missingRepository": "No repository field.",
		"brokenGitUrl": "Probably broken git url: %s",
		"nonObjectScripts": "scripts must be an object",
		"nonStringScript": "script values must be string commands",
		"nonArrayFiles": "Invalid 'files' member",
		"invalidFilename": "Invalid filename in 'files' list: %s",
		"nonArrayBundleDependencies": "Invalid 'bundleDependencies' list. Must be array of package names",
		"nonStringBundleDependency": "Invalid bundleDependencies member: %s",
		"nonDependencyBundleDependency": "Non-dependency in bundleDependencies: %s",
		"nonObjectDependencies": "%s field must be an object",
		"nonStringDependency": "Invalid dependency: %s %s",
		"deprecatedArrayDependencies": "specifying %s as array is deprecated",
		"deprecatedModules": "modules field is deprecated",
		"nonArrayKeywords": "keywords should be an array of strings",
		"nonStringKeyword": "keywords should be an array of strings",
		"conflictingName": "%s is also the name of a node core module.",
		"nonStringDescription": "'description' field should be a string",
		"missingDescription": "No description",
		"missingReadme": "No README data",
		"missingLicense": "No license field.",
		"nonEmailUrlBugsString": "Bug string field must be url, email, or {email,url}",
		"nonUrlBugsUrlField": "bugs.url field must be a string url. Deleted.",
		"nonEmailBugsEmailField": "bugs.email field must be a string email. Deleted.",
		"emptyNormalizedBugs": "Normalized value of bugs field is an empty object. Deleted.",
		"nonUrlHomepage": "homepage field must be a string url. Deleted.",
		"invalidLicense": "license should be a valid SPDX license expression",
		"typo": "%s should probably be %s."
	};
}) });

//#endregion
//#region ../../../node_modules/.pnpm/normalize-package-data@6.0.2/node_modules/normalize-package-data/lib/make_warning.js
var require_make_warning = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/normalize-package-data@6.0.2/node_modules/normalize-package-data/lib/make_warning.js": ((exports, module) => {
	var util = __require("util");
	var messages = require_warning_messages();
	module.exports = function() {
		var args = Array.prototype.slice.call(arguments, 0);
		var warningName = args.shift();
		if (warningName === "typo") return makeTypoWarning.apply(null, args);
		else {
			var msgTemplate = messages[warningName] ? messages[warningName] : warningName + ": '%s'";
			args.unshift(msgTemplate);
			return util.format.apply(null, args);
		}
	};
	function makeTypoWarning(providedName, probableName, field) {
		if (field) {
			providedName = field + "['" + providedName + "']";
			probableName = field + "['" + probableName + "']";
		}
		return util.format(messages.typo, providedName, probableName);
	}
}) });

//#endregion
//#region ../../../node_modules/.pnpm/normalize-package-data@6.0.2/node_modules/normalize-package-data/lib/normalize.js
var require_normalize = /* @__PURE__ */ __commonJS({ "../../../node_modules/.pnpm/normalize-package-data@6.0.2/node_modules/normalize-package-data/lib/normalize.js": ((exports, module) => {
	module.exports = normalize;
	var fixer = require_fixer();
	normalize.fixer = fixer;
	var makeWarning = require_make_warning();
	var fieldsToFix = [
		"name",
		"version",
		"description",
		"repository",
		"modules",
		"scripts",
		"files",
		"bin",
		"man",
		"bugs",
		"keywords",
		"readme",
		"homepage",
		"license"
	];
	var otherThingsToFix = [
		"dependencies",
		"people",
		"typos"
	];
	var thingsToFix = fieldsToFix.map(function(fieldName) {
		return ucFirst(fieldName) + "Field";
	});
	thingsToFix = thingsToFix.concat(otherThingsToFix);
	function normalize(data, warn, strict) {
		if (warn === true) {
			warn = null;
			strict = true;
		}
		if (!strict) strict = false;
		if (!warn || data.private) warn = function() {};
		if (data.scripts && data.scripts.install === "node-gyp rebuild" && !data.scripts.preinstall) data.gypfile = true;
		fixer.warn = function() {
			warn(makeWarning.apply(null, arguments));
		};
		thingsToFix.forEach(function(thingName) {
			fixer["fix" + ucFirst(thingName)](data, strict);
		});
		data._id = data.name + "@" + data.version;
	}
	function ucFirst(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}
}) });

//#endregion
//#region ../../../node_modules/.pnpm/unicorn-magic@0.1.0/node_modules/unicorn-magic/default.js
var init_default = __esm({ "../../../node_modules/.pnpm/unicorn-magic@0.1.0/node_modules/unicorn-magic/default.js": (() => {}) });

//#endregion
//#region ../../../node_modules/.pnpm/unicorn-magic@0.1.0/node_modules/unicorn-magic/node.js
function toPath(urlOrPath) {
	return urlOrPath instanceof URL ? fileURLToPath(urlOrPath) : urlOrPath;
}
var init_node = __esm({ "../../../node_modules/.pnpm/unicorn-magic@0.1.0/node_modules/unicorn-magic/node.js": (() => {
	init_default();
}) });

//#endregion
//#region ../../../node_modules/.pnpm/read-pkg@9.0.1/node_modules/read-pkg/index.js
async function readPackage({ cwd, normalize: normalize$1 = true } = {}) {
	const packageFile = await nativeFsp.readFile(getPackagePath(cwd), "utf8");
	return _readPackage(packageFile, normalize$1);
}
var import_normalize, getPackagePath, _readPackage;
var init_read_pkg = __esm({ "../../../node_modules/.pnpm/read-pkg@9.0.1/node_modules/read-pkg/index.js": (() => {
	init_parse_json();
	import_normalize = /* @__PURE__ */ __toESM(require_normalize(), 1);
	init_node();
	getPackagePath = (cwd) => path.resolve(toPath(cwd) ?? ".", "package.json");
	_readPackage = (file, normalize$1) => {
		const json = typeof file === "string" ? parseJson(file) : file;
		if (normalize$1) (0, import_normalize.default)(json);
		return json;
	};
}) });

//#endregion
//#region ../../../node_modules/.pnpm/read-package-up@11.0.0/node_modules/read-package-up/index.js
async function readPackageUp(options) {
	const filePath = await findUp("package.json", options);
	if (!filePath) return;
	return {
		packageJson: await readPackage({
			...options,
			cwd: path.dirname(filePath)
		}),
		path: filePath
	};
}
var init_read_package_up = __esm({ "../../../node_modules/.pnpm/read-package-up@11.0.0/node_modules/read-package-up/index.js": (() => {
	init_find_up_simple();
	init_read_pkg();
}) });

//#endregion
init_read_package_up();
export { readPackageUp };
//# sourceMappingURL=read-package-up-g4WhtCGq.mjs.map
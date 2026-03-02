import { TextEncoder, TextDecoder } from "fast-text-encoding";
import "react-native-url-polyfill/auto";

if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = TextDecoder;
  global.TextEncoder = TextEncoder;
}

console.log("✅ ePRX UV4: Polyfills locked and loaded.");

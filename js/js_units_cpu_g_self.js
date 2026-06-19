import { g_self } from "./js_units_g_self.js";

export const cpu_g_self = structuredClone(g_self);
cpu_g_self.id = "cpu_g_self";
cpu_g_self.name = "G-セルフ";

/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import { world } from "@minecraft/server";
import { Settings } from "./SystemSettings.js";
import {
  translations,
  BASE_LANGUAGE,
  resolveLanguageChain,
  validateTranslations,
  reportTranslationIssues,
} from "./locales/index.js";
import { warn } from "./lib/meow/Logging.js";

world.afterEvents.worldLoad.subscribe(async () => {
  if (!Settings.auto) {
    warn("Auto-fishing feature has been disabled (Settings.auto = 0)");
    return;
  }

  const meow = await import("./lib/index.js");

  // 缺失 key | 多余 key | 占位符不一致时，会在控制台输出警告，不会阻止启动
  reportTranslationIssues(validateTranslations());

  if (!(Settings.language in translations)) {
    // 允许 Settings.language 填 zh-HK、en-GB 这类未注册变体，自动解析到同语系语言
    const chain = resolveLanguageChain(Settings.language);
    const resolved = chain.find(l => l in translations) ?? BASE_LANGUAGE;
    meow.error(
      "Unexpected value for default language:",
      Settings.language,
      `(resolved to "${resolved}")`,
    );
    Settings.language = resolved;
  }

  const loaded = meow.loadAdminData();
  if (!loaded) {
    meow.refreshAdminKey();
  } else {
    if (meow.isKeyUsed(meow.getCurrentKey())) {
      meow.refreshAdminKey();
    } else {
      meow.info(`Current admin key: ${meow.getCurrentKey()}`);
    }
  }

  const modules = [
    {
      path: "./core/AutoFishingController.js",
      register: "registerAutoFishingController",
      error: "AutoFishingController registration failed",
    },
    {
      path: "./debug/TestCommands.js",
      register: "registerTestCommands",
      error: "Debug module registration failed",
    },
    {
      path: "./ui/SettingForm.js",
      register: "registerSettingTrigger",
      error: "Settings UI module registration failed",
    },
    {
      path: "./ui/TipManager.js",
      register: "registerTip",
      error: "Tip manager module registration failed",
    },
    {
      path: "./core/FishingProcessor.js",
      register: "registerFishingProcessor",
      error: "Core fishing processor module registration failed",
    },
  ];

  for (const { path, register, error: errorMsg } of modules) {
    try {
      const mod = await import(path);
      if (mod[register]) mod[register]();
    } catch (err) {
      meow.error(errorMsg, err);
    }
  }

  meow.info("MeowFish has successfully started!");
});

/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

/**
 * 数字大数单位阶梯配置。
 * 数组请务必按 value 从大到小（降序）排列，以便优先匹配最大单位。
 */

export const NumberUnits = {
  // 简体中文：万进制
  zh_CN: [
    { value: 1e8, symbol: "亿" },
    { value: 1e4, symbol: "万" }
  ],
  
  // 繁体中文：万进制
  zh_TW: [
    { value: 1e8, symbol: "億" },
    { value: 1e4, symbol: "萬" }
  ],

  // 英文及国际通用：千进制
  en_US: [
    { value: 1e9, symbol: "B" },
    { value: 1e6, symbol: "M" },
    { value: 1e3, symbol: "K" }
  ],

  // 兜底配置：当传入的 lang 未配置时，统一使用英文千进制
  default: [
    { value: 1e9, symbol: "B" },
    { value: 1e6, symbol: "M" },
    { value: 1e3, symbol: "K" }
  ]
};

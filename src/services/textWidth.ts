// 粗略估計文字寬度（ch 單位）：中日韓全形字視覺寬度約是拉丁字母的兩倍，
// 直接用字元數當 ch 數會讓中文名稱被裁切，所以全形字元算 2、其餘算 1。
export function estimateWidthCh(text: string): number {
  let width = 0;
  for (const ch of text) {
    width += /[　-鿿＀-￯]/.test(ch) ? 2 : 1;
  }
  return Math.max(width + 1, 3);
}

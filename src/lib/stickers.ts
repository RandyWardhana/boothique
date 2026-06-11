/** Quick-add sticker palettes per direction. */
export interface StickerTemplate {
  text: string;
  color: string;
}

export const STICKER_SETS: Record<string, StickerTemplate[]> = {
  y2k: [
    { text: '★', color: '#ffe14d' },
    { text: '♡', color: '#ffffff' },
    { text: 'WOW', color: '#2bd9e8' },
    { text: '!!', color: '#ff5ec4' },
    { text: '✶', color: '#3dff8a' },
  ],
  vintage: [
    { text: '★', color: '#d8b15e' },
    { text: 'XO', color: '#c4452c' },
    { text: '♡', color: '#f0e4ce' },
    { text: 'CLASSIC', color: '#9a7b3f' },
  ],
  instant: [
    { text: '☺', color: '#e9694f' },
    { text: 'xoxo', color: '#5e8fb8' },
    { text: '♡', color: '#e9694f' },
    { text: '★', color: '#26262b' },
  ],
  seoul: [
    { text: '♥', color: '#ef7ba2' },
    { text: '✿', color: '#a48ad4' },
    { text: '☆', color: '#f4b8cd' },
    { text: '!!', color: '#ef7ba2' },
    { text: '><', color: '#a48ad4' },
  ],
};

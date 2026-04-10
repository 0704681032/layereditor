// High quality ad images from Unsplash
// These are free to use images

export interface AdImage {
  id: string;
  name: string;
  filename: string;
  width: number;
  height: number;
}

export const adImages: AdImage[] = [
  {
    id: 'premium-poster',
    name: '高端品牌海报',
    filename: '高端品牌海报-原始高清.png',
    width: 2400,
    height: 1600,
  },
  {
    id: 'smartphone',
    name: '智能手机',
    filename: 'smartphone.jpg',
    width: 1200,
    height: 800,
  },
  {
    id: 'headphones',
    name: '头戴耳机',
    filename: 'headphones.jpg',
    width: 1200,
    height: 800,
  },
  {
    id: 'perfume',
    name: '香水产品',
    filename: 'perfume.jpg',
    width: 1200,
    height: 800,
  },
  {
    id: 'sneakers',
    name: '运动鞋',
    filename: 'sneakers.jpg',
    width: 1200,
    height: 800,
  },
  {
    id: 'fashion-style',
    name: '时尚服饰',
    filename: 'fashion-style.jpg',
    width: 1200,
    height: 800,
  },
];
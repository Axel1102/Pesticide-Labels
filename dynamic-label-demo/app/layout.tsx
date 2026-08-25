import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Product A 动态农药标签',
  description: '按亩数直接生成水量、药量和量药容器换算结果的实验原型。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'A、B、C 动态农药标签',
  description: '选择三款实验农药，按作物、对象、时期和用药情况生成用药判断与剂量图。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '动态农药标签实验原型',
  description: '基于作物、对象、时期、使用历史和混配计划生成个性化用药建议的实验原型。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
